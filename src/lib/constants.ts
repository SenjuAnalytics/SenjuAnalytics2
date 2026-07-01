/**
 * Application-wide constants
 * Organized by category for easy maintenance
 */

// ── Solana Addresses ──────────────────────────────────────────
export const SOLANA_ADDRESSES = {
  /** Burn address (incinerator) */
  BURN: "1nc1nerator11111111111111111111111111111111",
  /** Null/system address */
  NULL: "11111111111111111111111111111111",
} as const;

// ── Bonding Curve Constants ───────────────────────────────────
export const BONDING_CURVE = {
  /** Byte offset: bonding curve completion status (bool) */
  OFFSET_COMPLETE: 48,
  /** Byte offset: creator address (Pubkey, 32 bytes) */
  OFFSET_CREATOR: 49,
  /** Byte offset: mayhem mode flag (bool) - added Nov 2025 */
  OFFSET_MAYHEM: 81,
  /** Byte offset: cashback enabled flag (bool) - added Feb 2026 */
  OFFSET_CASHBACK: 82,
  /** Minimum account data length for valid bonding curve */
  MIN_LENGTH: 83,
} as const;

// ── Token Standards ───────────────────────────────────────────
export const TOKEN_STANDARDS = {
  /** Standard Solana address length */
  ADDRESS_LENGTH: 32,
  /** Minimum address length for validation */
  MIN_ADDRESS_LENGTH: 32,
  /** SOL decimals */
  SOL_DECIMALS: 9,
  /** Default token decimals */
  DEFAULT_DECIMALS: 9,
  /** USDC/USDT decimals */
  STABLECOIN_DECIMALS: 6,
} as const;

// ── API Limits ────────────────────────────────────────────────
export const API_LIMITS = {
  /** Default transaction fetch limit */
  DEFAULT_TX_LIMIT: 50,
  /** Maximum transaction fetch limit */
  MAX_TX_LIMIT: 100,
  /** Default pairs display limit */
  DEFAULT_PAIRS_LIMIT: 10,
  /** Chart data points */
  CHART_DATA_POINTS: 24,
  /** Fee history days */
  FEE_HISTORY_DAYS: 14,
} as const satisfies Record<string, number>;

// ── Fee Calculations ──────────────────────────────────────────
export const FEE_RATES = {
  /** Standard DEX fee (0.3%) */
  STANDARD_DEX_FEE: 0.003,
  /** Days in year for APR calculation */
  DAYS_PER_YEAR: 365,
} as const;

// ── Known Program IDs ─────────────────────────────────────────
export const KNOWN_PROGRAMS = {
  STREAMFLOW: "strmRqUCoQUgGUan5YhzUZa6KqdzwX5L6FpUxfmKg5m",
  UNLOC: "3LNnnk5gXZKhP2K3BcBt7AKJnk5AAVBT9N7ekVKjFcMB",
  FLUXBEAM_LOCK: "FLUXubRmkEi2q6K3Y9kBPg9248ggaZVsoSFhtJHSrm1X",
  TOKEN_LOCK: "7UX2i7SucgLMQcfZ75s3VXmZZY4YRUyJN9X1RgfMoDUi",
} as const;

export const LOCK_PROGRAM_NAMES: Record<string, string> = {
  [KNOWN_PROGRAMS.STREAMFLOW]: "Streamflow",
  [KNOWN_PROGRAMS.UNLOC]: "Unloc",
  [KNOWN_PROGRAMS.FLUXBEAM_LOCK]: "Fluxbeam Lock",
  [KNOWN_PROGRAMS.TOKEN_LOCK]: "Token Lock",
} as const;

// ── Time Constants ────────────────────────────────────────────
export const TIME = {
  /** Milliseconds in a second */
  SECOND: 1000,
  /** Milliseconds in a minute */
  MINUTE: 60 * 1000,
  /** Milliseconds in an hour */
  HOUR: 60 * 60 * 1000,
  /** Milliseconds in a day */
  DAY: 24 * 60 * 60 * 1000,
  /** Timestamp threshold (before this = seconds, after = milliseconds) */
  TIMESTAMP_THRESHOLD: 1e12,
} as const;

// ── UI Constants ──────────────────────────────────────────────
export const UI = {
  /** Maximum description length before truncation */
  MAX_DESCRIPTION_LENGTH: 150,
  /** Skeleton loading items count */
  SKELETON_ITEMS: 5,
} as const;

// ── Text Size Classes ─────────────────────────────────────────
// Change sizes here → all components update automatically.
// Never hardcode pixel-based sizes (text-[10px]) in component files.
export const TEXT = {
  /** Smallest UI text — badges, status pills, sub-timestamps */
  MICRO: "text-xs",
  /** Detail / secondary text — descriptions, labels, table sub-text */
  DETAIL: "text-[13px]",
} as const;

/** Convenience alias — same as TEXT.MICRO */
export const TEXT_MICRO = TEXT.MICRO;
/** Convenience alias — same as TEXT.DETAIL */
export const TEXT_DETAIL = TEXT.DETAIL;
