/**
 * @deprecated
 * All functions have been moved to src/services/token.service.ts (and helius.service.ts).
 * This file exists only for backward compatibility while route files are migrated.
 *
 * DO NOT add new functions here.
 * DO NOT import this file in new code — import from @/services/token.service directly.
 */

export {
  getTokenInfo,
  getTokenPairs,
  getTokenTransactions,
  getBurnRecords,
  getTokenLocks,
  getLiquidityPools,
} from "@/services/token.service";

export async function getFeeClaimRecords(mint: string) {
  const { getAllFeeClaims } = await import("@/lib/fees");
  return getAllFeeClaims(mint);
}
