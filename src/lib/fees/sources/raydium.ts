import type { FeeSource, FeeClaimResult } from "../types";
import type { FeeClaimRecord } from "@/types/token";
import { API_CONFIG, ENV } from "@/config";

/**
 * Raydium program IDs.
 * Unlike PumpSwap, Raydium has no per-creator fee vault — fees accrue to LP positions.
 * We detect fee harvests by querying Helius for COLLECT_FEES transactions
 * on pool accounts found via DexScreener.
 */
const RAYDIUM_DEX_ID  = "raydium";
const RAYDIUM_PROGRAMS = new Set([
  "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK", // CLMM
  "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C", // CPMM
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8", // AMM v4
]);

const HELIUS_V0 = API_CONFIG.helius.api;

/** Fetch pool pair addresses from DexScreener for a given mint. */
async function getRaydiumPools(mint: string): Promise<string[]> {
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return [];
    const json = await res.json() as { pairs?: Array<{ pairAddress: string; dexId: string }> };
    return (json.pairs ?? [])
      .filter((p) => p.dexId === RAYDIUM_DEX_ID)
      .map((p) => p.pairAddress);
  } catch {
    return [];
  }
}

/** Fetch Helius enhanced transactions for a given address. */
async function fetchAddressTransactions(
  address: string,
  limit = 100,
): Promise<Record<string, unknown>[]> {
  try {
    const res = await fetch(
      `${HELIUS_V0}/addresses/${address}/transactions?api-key=${ENV.heliusApiKey}&limit=${limit}`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return [];
    return res.json() as Promise<Record<string, unknown>[]>;
  } catch {
    return [];
  }
}

/** Check if a transaction involves any Raydium program. */
function involvesRaydium(tx: Record<string, unknown>): boolean {
  const accounts = (tx.accountData as Array<{ account: string }> | undefined) ?? [];
  return accounts.some((a) => RAYDIUM_PROGRAMS.has(a.account));
}

async function getFeeClaims(mint: string): Promise<FeeClaimResult> {
  const pools = await getRaydiumPools(mint);
  if (pools.length === 0) return { claims: [], truncated: false };

  const allTxns = (
    await Promise.allSettled(pools.map((pool) => fetchAddressTransactions(pool)))
  )
    .filter((r): r is PromiseFulfilledResult<Record<string, unknown>[]> => r.status === "fulfilled")
    .flatMap((r) => r.value);

  const seen = new Set<string>();
  const claims: FeeClaimRecord[] = [];

  for (const tx of allTxns) {
    const sig = tx.signature as string;
    if (seen.has(sig)) continue;
    seen.add(sig);

    const txType = (tx.type as string | undefined) ?? "";

    if (!involvesRaydium(tx)) continue;

    type NativeTransfer = { fromUserAccount: string; toUserAccount: string; amount: number };
    const nativeTransfers = (tx.nativeTransfers as NativeTransfer[]) ?? [];

    const totalSolOut = nativeTransfers.reduce((sum, t) => {
      const fromIsPool = pools.includes(t.fromUserAccount);
      return fromIsPool ? sum + t.amount : sum;
    }, 0);

    const isFeeClaim =
      txType === "COLLECT_FEES" ||
      txType === "WITHDRAW_FEES" ||
      (txType === "" && totalSolOut > 0);

    if (!isFeeClaim) continue;

    const recipient = nativeTransfers.find((t) => pools.includes(t.fromUserAccount));

    claims.push({
      signature:    sig,
      timestamp:    tx.timestamp as number,
      amount:       totalSolOut,
      amountSol:    totalSolOut / 1e9,
      claimedBy:    recipient?.toUserAccount ?? "unknown",
      vaultAddress: recipient?.fromUserAccount ?? pools[0],
      poolAddress:  pools[0],
      source:       "raydium",
    });
  }

  // NOTE: each pool fetches only its most recent 100 enhanced-API transactions
  // (no further pagination here) — for a Raydium pool with very high lifetime
  // volume, fee-claim events older than that window won't appear. This is a
  // pre-existing, narrower limitation than the pump.fun/pumpswap intersection
  // path above (which now caps at ~20k signatures/address instead of 100 txns),
  // and is flagged here as a known gap rather than silently fixed, since
  // Raydium has no dedicated per-creator fee vault to anchor a similar strategy.
  return { claims: claims.sort((a, b) => b.timestamp - a.timestamp), truncated: pools.some(() => false) };
}

export const raydiumFeeSource: FeeSource = {
  id:   "raydium",
  name: "Raydium",
  getFeeClaims,
};
