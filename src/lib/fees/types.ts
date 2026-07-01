import type { FeeClaimRecord } from "@/types/token";

export interface FeeClaimResult {
  claims: FeeClaimRecord[];
  /** True if older fee-claim history may exist beyond what was fetched
   *  (very old / high-volume tokens) — see lib/fees/helius.ts MAX_SIGNATURE_PAGES. */
  truncated: boolean;
}

export interface FeeSource {
  id: string;
  name: string;
  getFeeClaims: (mint: string) => Promise<FeeClaimResult>;
}
