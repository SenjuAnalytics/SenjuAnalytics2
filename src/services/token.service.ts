/**
 * Token data service
 * High-level token information aggregation — single source of truth for all token API logic.
 *
 * Functions migrated here from the deprecated lib/api.ts:
 *   - getTokenTransactions  (parsed Helius Enhanced TX)
 *   - getBurnRecords        (filters transactions for BURN type)
 *   - getTokenLocks         (delegates to lib/locks)
 *   - getLiquidityPools     (derives from DexScreener pairs)
 */

import type {
  TokenInfo,
  TokenTransaction,
  TokenLock,
  BurnRecord,
  LiquidityPool,
} from "@/types/token";
import {
  TOKEN_STANDARDS,
  SOLANA_ADDRESSES,
  API_LIMITS,
  LOCK_PROGRAM_NAMES,
  FEE_RATES,
} from "@/lib/constants";
import { logError } from "@/lib/error-logger";
import * as helius from "./helius.service";
import * as external from "./external.service";

// ── Token info ────────────────────────────────────────────────

export async function getTokenInfo(mint: string): Promise<TokenInfo> {
  try {
    const [accountInfo, largestAccounts, jupPrice, dasMetadata] = await Promise.allSettled([
      helius.getAccountInfo(mint),
      helius.getTokenLargestAccounts(mint),
      external.getJupiterPrice(mint),
      helius.getAssetMetadata(mint),
    ]);

    const info: TokenInfo = {
      address: mint,
      name: "Unknown Token",
      symbol: "???",
      decimals: TOKEN_STANDARDS.DEFAULT_DECIMALS,
      supply: 0,
    };

    if (accountInfo.status === "fulfilled" && accountInfo.value) {
      const account = accountInfo.value as {
        value?: { data?: { parsed?: { info?: { decimals?: number; supply?: string } } } };
      };
      const parsed = account.value?.data?.parsed?.info;
      if (parsed) {
        info.decimals = parsed.decimals ?? TOKEN_STANDARDS.DEFAULT_DECIMALS;
        info.supply = Number(parsed.supply ?? "0") / Math.pow(10, info.decimals);
      }
    }

    if (largestAccounts.status === "fulfilled" && largestAccounts.value) {
      const accounts = largestAccounts.value as { value?: Array<unknown> };
      info.holders = accounts.value?.length ?? 0;
    }

    if (jupPrice.status === "fulfilled" && jupPrice.value) {
      info.price = jupPrice.value;
      if (info.price && info.supply) {
        info.marketCap = info.price * info.supply;
      }
    }

    if (dasMetadata.status === "fulfilled" && dasMetadata.value) {
      const asset = dasMetadata.value as {
        content?: {
          metadata?: { name?: string; symbol?: string; description?: string };
          links?: { image?: string };
          files?: Array<{ uri?: string }>;
          json_uri?: string;
        };
      };
      if (asset.content) {
        info.name = asset.content.metadata?.name || info.name;
        info.symbol = asset.content.metadata?.symbol || info.symbol;
        info.description = asset.content.metadata?.description;
        info.logoURI = asset.content.links?.image || asset.content.files?.[0]?.uri;
        info._jsonUri = asset.content.json_uri || "";
      }
    }

    return info;
  } catch (error) {
    logError("Failed to fetch token info", error, { mint });
    throw error;
  }
}

// ── Token pairs ───────────────────────────────────────────────

export async function getTokenPairs(mint: string) {
  return external.getDexScreenerPairs(mint);
}

// ── SOL price ─────────────────────────────────────────────────

export async function getSolPrice() {
  return external.getSolPriceUsd();
}

// ── Transaction history (parsed) ──────────────────────────────

/**
 * Fetch and parse Helius Enhanced Transaction history into typed TokenTransaction objects.
 * Uses getRawTransactionHistory from helius.service (fixed URL, uses ENV.heliusApiKey).
 */
export async function getTokenTransactions(
  mint: string,
  limit: number = API_LIMITS.DEFAULT_TX_LIMIT,
): Promise<TokenTransaction[]> {
  try {
    const rawTxns = await helius.getRawTransactionHistory(mint, limit);

    return rawTxns.map((tx) => {
      const tokenTransfers =
        (tx.tokenTransfers as TokenTransaction["tokenTransfers"]) || [];
      const nativeTransfers =
        (tx.nativeTransfers as TokenTransaction["nativeTransfers"]) || [];

      let type: TokenTransaction["type"] = "OTHER";
      const desc = ((tx.description as string) || "").toLowerCase();

      if (
        tx.type === "BURN" ||
        tokenTransfers.some(
          (t) =>
            t.toUserAccount === SOLANA_ADDRESSES.BURN ||
            t.toUserAccount === SOLANA_ADDRESSES.NULL,
        )
      ) {
        type = "BURN";
      } else if (tx.type === "SWAP" || desc.includes("swap")) {
        type = "SWAP";
      } else if (
        desc.includes("add liquidity") ||
        tx.type === "ADD_LIQUIDITY"
      ) {
        type = "ADD_LIQUIDITY";
      } else if (
        desc.includes("remove liquidity") ||
        tx.type === "REMOVE_LIQUIDITY"
      ) {
        type = "REMOVE_LIQUIDITY";
      } else if (
        Object.keys(LOCK_PROGRAM_NAMES).some((p) => desc.includes(p))
      ) {
        type = "LOCK";
      } else if (
        tx.type === "TRANSFER" ||
        desc.includes("transfer")
      ) {
        type = "TRANSFER";
      }

      const burnTransfer = tokenTransfers.find(
        (t) =>
          t.toUserAccount === SOLANA_ADDRESSES.BURN ||
          t.toUserAccount === SOLANA_ADDRESSES.NULL,
      );

      return {
        signature: tx.signature as string,
        timestamp: tx.timestamp as number,
        type,
        amount:
          burnTransfer?.tokenAmount ?? tokenTransfers[0]?.tokenAmount,
        from: tokenTransfers[0]?.fromUserAccount,
        to: tokenTransfers[0]?.toUserAccount,
        description: tx.description as string,
        fee: tx.fee as number,
        tokenTransfers,
        nativeTransfers,
      } as TokenTransaction;
    });
  } catch {
    return [];
  }
}

// ── Burn records ──────────────────────────────────────────────

export async function getBurnRecords(mint: string): Promise<BurnRecord[]> {
  try {
    const txns = await getTokenTransactions(mint, API_LIMITS.MAX_TX_LIMIT);
    return txns
      .filter((tx) => tx.type === "BURN")
      .map((tx) => ({
        signature: tx.signature,
        amount: tx.amount || 0,
        timestamp: tx.timestamp,
        burnedBy: tx.from || "Unknown",
        type: "BURN" as const,
      }));
  } catch {
    return [];
  }
}

// ── Token locks ───────────────────────────────────────────────

export async function getTokenLocks(mint: string): Promise<TokenLock[]> {
  const { getAllLocks } = await import("@/lib/locks");
  return getAllLocks(mint);
}

// ── Liquidity pools ───────────────────────────────────────────

export async function getLiquidityPools(mint: string): Promise<LiquidityPool[]> {
  const pairs = await getTokenPairs(mint);
  return pairs.map((pair) => ({
    pairAddress: pair.pairAddress,
    dex: pair.dexId,
    tokenA: {
      symbol: pair.baseToken.symbol,
      address: pair.baseToken.address,
      amount: pair.liquidity?.base || 0,
    },
    tokenB: {
      symbol: pair.quoteToken.symbol,
      address: pair.quoteToken.address,
      amount: pair.liquidity?.quote || 0,
    },
    liquidityUsd: pair.liquidity?.usd || 0,
    volume24h: pair.volume?.h24 || 0,
    fees24h:
      (pair.volume?.h24 || 0) * FEE_RATES.STANDARD_DEX_FEE,
    apr:
      pair.liquidity?.usd
        ? ((pair.volume?.h24 || 0) *
            FEE_RATES.STANDARD_DEX_FEE *
            FEE_RATES.DAYS_PER_YEAR *
            100) /
          pair.liquidity.usd
        : 0,
    createdAt: pair.pairCreatedAt,
  }));
}
