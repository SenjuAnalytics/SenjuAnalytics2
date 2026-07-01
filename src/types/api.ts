/**
 * API response types — shared between hooks and components.
 * Single source of truth for all API response shapes.
 *
 * Previously these were scattered across:
 *   - hooks/useTokenData.ts (FeesResponse, TokenResponse, etc.)
 *   - components/dashboard/FeeClaimTab.tsx (FeeApiResponse — duplicate)
 */

import type {
  TokenInfo,
  TokenPair,
  TokenLock,
  BurnRecord,
  FeeClaimRecord,
  LiquidityPool,
} from "./token";

import type {
  FeeMode,
  FeeModeInfo,
  AgentStats,
} from "@/lib/fees/modes/types";

// ── Token ─────────────────────────────────────────────────────

export interface TokenResponse {
  token: TokenInfo;
  pairs: TokenPair[];
}

// ── Fees ──────────────────────────────────────────────────────

export interface FeesResponse {
  fees: FeeClaimRecord[];
  /**
   * True if older fee-claim history may exist beyond the fetched window.
   * Surface a notice in the UI when this is true so users aren't misled.
   */
  truncated?: boolean;
  unclaimedSol?: number;
  vaultInfo?: {
    vaultAta: string;
    coinCreator: string;
    poolPda: string;
  } | null;
  feeMode?: FeeMode;
  modeInfo?: FeeModeInfo | null;
  /** Properly typed — was `unknown` in the old hook definition */
  agentStats?: AgentStats | null;
}

// ── Locks ─────────────────────────────────────────────────────

export interface LocksResponse {
  locks: TokenLock[];
}

// ── Burns ─────────────────────────────────────────────────────

export interface BurnsResponse {
  burns: BurnRecord[];
}

// ── Liquidity ─────────────────────────────────────────────────

export interface LiquidityResponse {
  pools: LiquidityPool[];
}

// ── Re-exports for convenience ────────────────────────────────

export type { FeeMode, FeeModeInfo, AgentStats };
