/**
 * External API services (DexScreener, Jupiter, etc.)
 * Centralized external data fetching
 */

import { API_CONFIG } from "@/config";
import { logError } from "@/lib/error-logger";
import type { TokenPair } from "@/types/token";

/**
 * Fetch token price from Jupiter aggregator
 */
export async function getJupiterPrice(mint: string): Promise<number | null> {
  try {
    const res = await fetch(`${API_CONFIG.external.jupiter}?ids=${mint}`, {
      signal: AbortSignal.timeout(API_CONFIG.external.timeout),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.[mint]?.price ?? null;
  } catch (error) {
    logError("Failed to fetch Jupiter price", error, { mint });
    return null;
  }
}

/**
 * Fetch trading pairs from DexScreener
 */
export async function getDexScreenerPairs(mint: string): Promise<TokenPair[]> {
  try {
    const res = await fetch(`${API_CONFIG.external.dexscreener}/tokens/${mint}`, {
      signal: AbortSignal.timeout(API_CONFIG.external.timeout),
    });

    if (!res.ok) return [];
    const data = await res.json();
    const pairs = (data.pairs || []) as TokenPair[];
    
    // Filter for Solana only
    return pairs.filter((p) => !p.chainId || p.chainId === "solana");
  } catch (error) {
    logError("Failed to fetch DexScreener pairs", error, { mint });
    return [];
  }
}

/**
 * Fetch SOL price in USD from Binance
 */
export async function getSolPriceUsd(): Promise<number> {
  try {
    const res = await fetch(`${API_CONFIG.external.binance}/ticker/price?symbol=SOLUSDT`, {
      signal: AbortSignal.timeout(API_CONFIG.external.timeout),
    });

    if (!res.ok) return 0;
    const data = await res.json();
    return Number(data?.price) || 0;
  } catch (error) {
    logError("Failed to fetch SOL price", error);
    return 0;
  }
}
