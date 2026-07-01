/**
 * Centralized configuration management
 * All app-wide settings in one place
 */

// ── Environment Variables ─────────────────────────────────────
export const ENV = {
  // Server-side only
  heliusApiKey: process.env.HELIUS_API_KEY || "",
  
  // Public (safe to expose)
  nodeEnv: process.env.NODE_ENV || "development",
  
  // Feature flags
  features: {
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true",
    enableTestMode: process.env.NODE_ENV === "development",
  },
} as const;

// ── API Configuration ─────────────────────────────────────────
export const API_CONFIG = {
  helius: {
    rpc: `https://mainnet.helius-rpc.com/?api-key=${ENV.heliusApiKey}`,
    api: "https://api.helius.xyz/v0",
    timeout: 5_000,
  },
  external: {
    dexscreener: "https://api.dexscreener.com/latest/dex",
    jupiter: "https://api.jup.ag/price/v2",
    binance: "https://api.binance.com/api/v3",
    timeout: 6_000,
  },
  rateLimit: {
    maxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
  },
} as const;

// ── Application Settings ──────────────────────────────────────
export const APP_CONFIG = {
  name: "Senju",
  description: "Solana Token Analytics Dashboard",
  version: "0.1.0",
  social: {
    twitter: "https://twitter.com/senju",
    github: "https://github.com/senju",
  },
  meta: {
    defaultTitle: "Senju - Solana Token Analytics",
    titleTemplate: "%s | Senju",
    defaultDescription: "Advanced on-chain analytics for Solana tokens",
  },
} as const;

// ── Validation Helpers ────────────────────────────────────────
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!ENV.heliusApiKey && ENV.nodeEnv === "production") {
    errors.push("HELIUS_API_KEY is required in production");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Validate on import in development
if (ENV.nodeEnv === "development") {
  const validation = validateConfig();
  if (!validation.valid) {
    console.warn("⚠️  Configuration warnings:", validation.errors);
  }
}
