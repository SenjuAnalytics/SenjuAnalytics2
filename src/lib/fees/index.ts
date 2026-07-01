import type { FeeClaimRecord } from "@/types/token";
import type { FeeSource, FeeClaimResult } from "./types";
import { pumpswapFeeSource } from "./sources/pumpswap";
import { pumpfunFeeSource } from "./sources/pumpfun";
import { raydiumFeeSource } from "./sources/raydium";

// ── Mode system re-exports ───────────────────────────────────
export { detectFeeMode, FEE_MODE_INFO } from "./modes";
export type { FeeMode, FeeModeResult, FeeModeInfo } from "./modes";
export { getCreatorVaultData } from "./modes/creator";
export type { CreatorVaultData } from "./modes/creator";
export { getCashbackStats, getUnclaimedCashback } from "./modes/cashback";
export type { CashbackStats, CashbackDistributionRecord } from "./modes/types";
export { getAgentStats } from "./modes/agent";
export type { AgentStats, AgentCurrencyStats } from "./modes/types";

/**
 * Registry of all fee sources (per-DEX claim detectors).
 * Add new sources here to extend fee detection — no other files need to change.
 */
const SOURCES: FeeSource[] = [
  pumpswapFeeSource,
  pumpfunFeeSource,
  raydiumFeeSource,
];

export interface AllFeeClaimsResult {
  claims: FeeClaimRecord[];
  /**
   * True if at least one source hit the signature-page cap
   * (lib/fees/helius.ts MAX_SIGNATURE_PAGES) and may have older
   * fee-claim history not reflected in this result set.
   * The UI should surface a notice like "Showing most recent history only".
   */
  truncated: boolean;
}

/**
 * Fetch fee claim records from all registered sources in parallel.
 * Results are merged and sorted newest-first.
 * A failed source is silently skipped (partial results are still returned).
 */
export async function getAllFeeClaims(mint: string): Promise<AllFeeClaimsResult> {
  const results = await Promise.allSettled(
    SOURCES.map((s) => s.getFeeClaims(mint)),
  );

  let truncated = false;
  const allClaims: FeeClaimRecord[] = [];

  for (const r of results) {
    if (r.status === "fulfilled") {
      allClaims.push(...r.value.claims);
      if (r.value.truncated) truncated = true;
    }
  }

  allClaims.sort((a, b) => b.timestamp - a.timestamp);

  // Deduplicate by signature (multiple sources may detect the same tx)
  const seen = new Set<string>();
  const claims = allClaims.filter((r) => {
    if (seen.has(r.signature)) return false;
    seen.add(r.signature);
    return true;
  });

  return { claims, truncated };
}

export { SOURCES };
export type { FeeSource, FeeClaimResult };
