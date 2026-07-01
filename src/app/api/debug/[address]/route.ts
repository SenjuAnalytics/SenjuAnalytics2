import { getTokenPairs } from "@/services/token.service";
import { heliusRpc } from "@/services/helius.service";
import type { NextRequest } from "next/server";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ address: string }> }) {
  const { address } = await ctx.params;

  const [pairs, asset, sigResult] = await Promise.allSettled([
    getTokenPairs(address),
    heliusRpc("getAsset", [{ id: address }]),
    heliusRpc("getSignaturesForAddress", [address, { limit: 5 }]),
  ]);

  const pairList = pairs.status === "fulfilled" ? pairs.value : [];
  const assetData = asset.status === "fulfilled" ? asset.value : null;
  const sigs: Array<{ signature: string }> = sigResult.status === "fulfilled" ? ((sigResult.value as Array<{signature: string}>) ?? []) : [];

  let oldestTxPrograms: string[] = [];
  if (sigs.length > 0) {
    const oldestSig = sigs[sigs.length - 1].signature;
    const tx = await heliusRpc("getTransaction", [oldestSig, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }]);
    if (tx) {
      oldestTxPrograms = (tx.transaction?.message?.accountKeys ?? []).map(
        (k: { pubkey: string } | string) => (typeof k === "string" ? k : k.pubkey),
      );
    }
  }

  return Response.json({
    address,
    // DexScreener signals
    dexscreener: {
      pairCount: pairList.length,
      pairs: pairList.map((p) => ({
        dexId: p.dexId,
        labels: p.labels ?? [],
        liquidity: p.liquidity?.usd ?? 0,
      })),
    },
    // On-chain signals from Helius DAS
    onchain: {
      updateAuthority: assetData?.authorities?.[0]?.address ?? null,
      allAuthorities: (assetData?.authorities ?? []).map((a: { address: string }) => a.address),
      creators: (assetData?.creators ?? []).map((c: { address: string; verified: boolean }) => ({
        address: c.address,
        verified: c.verified,
      })),
      jsonUri: assetData?.content?.json_uri ?? null,
      // Programs involved in the oldest available transaction
      oldestTxPrograms,
    },
  });
}
