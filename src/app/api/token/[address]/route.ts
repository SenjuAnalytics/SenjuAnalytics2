import * as tokenService from "@/services/token.service";
import { detectLaunchPlatform } from "@/lib/platforms";
import { getBondingCurveInfo, getPumpSwapPrice } from "@/lib/platforms/pumpfun";
import { getSolPriceUsd } from "@/lib/platforms/rpc";
import { logError } from "@/lib/error-logger";
import { validateTokenAddress } from "@/lib/validation";
import type { NextRequest } from "next/server";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ address: string }> }) {
  const { address } = await ctx.params;

  // Validate input
  const validation = validateTokenAddress(address);
  if (!validation.valid) {
    return Response.json(
      { error: validation.error },
      { status: 400 }
    );
  }

  try {
    const [tokenInfo, pairs, solPriceResult] = await Promise.allSettled([
      tokenService.getTokenInfo(address),
      tokenService.getTokenPairs(address),
      tokenService.getSolPrice(),
    ]);

    const solPrice = solPriceResult.status === "fulfilled" ? solPriceResult.value : 0;
    const bcResult = await getBondingCurveInfo(address, solPrice);

    const info     = tokenInfo.status === "fulfilled" ? tokenInfo.value : null;
    const pairList = pairs.status     === "fulfilled" ? pairs.value     : [];
    const bcInfo   = bcResult;

    if (info) {
      if (bcInfo) {
        // Active bonding curve (complete=false) — on-chain data is authoritative
        if (bcInfo.price)                    info.price                = bcInfo.price;
        if (bcInfo.marketCap)                info.marketCap            = bcInfo.marketCap;
        if (bcInfo.progress !== undefined)   info.bondingCurveProgress = bcInfo.progress;
        if (bcInfo.realSolCollected !== undefined) info.bondingCurveRealSol = bcInfo.realSolCollected;
      } else {
        // Graduated / non-pump token
        if (pairList.length > 0) {
          const sorted  = [...pairList].sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
          const best    = sorted[0];
          info.price          = info.price || Number(best.priceUsd || 0);
          info.priceChange24h = best.priceChange?.h24;
          info.volume24h      = best.volume?.h24;
          info.fdv            = best.fdv;
        }

        // Fallback: PumpSwap pool reserves (when Jupiter + DexScreener both fail)
        if (!info.price && solPrice > 0) {
          const swapPrice = await getPumpSwapPrice(address, solPrice, info.decimals);
          if (swapPrice?.price) {
            info.price = swapPrice.price;
            if (info.supply) info.marketCap = swapPrice.price * info.supply;
          }
        }
      }

      // Collect unique DexScreener signals from all pairs
      const dexIds = [...new Set(pairList.map((p) => p.dexId).filter(Boolean))];
      const labels = [...new Set(pairList.flatMap((p) => p.labels ?? []))];

      // Detect launch platform — delegates to lib/platforms/ (pool checks + DexScreener)
      info.launchPlatform =
        (await detectLaunchPlatform({ mint: address, dexIds, labels })) ?? undefined;

      delete info._jsonUri;
    }

    return Response.json({ token: info, pairs: pairList });
  } catch (error) {
    logError("Failed to fetch token info", error, { address });
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to fetch token info" },
      { status: 500 },
    );
  }
}
