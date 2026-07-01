/**
 * Helius API service
 * Handles all Helius RPC and Enhanced API interactions.
 * Single source for all Helius calls — no hardcoded URLs anywhere else.
 */

import { API_CONFIG, ENV } from "@/config";
import { logError } from "@/lib/error-logger";

// ── JSON-RPC helper ───────────────────────────────────────────

/**
 * Make a JSON-RPC call to Helius RPC endpoint.
 */
export async function heliusRpc(method: string, params: unknown[]): Promise<unknown> {
  try {
    const res = await fetch(API_CONFIG.helius.rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: "senju", method, params }),
      signal: AbortSignal.timeout(API_CONFIG.helius.timeout),
    });

    if (!res.ok) {
      throw new Error(`Helius RPC error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error.message || "Unknown RPC error");
    }

    return data.result;
  } catch (error) {
    logError("Helius RPC call failed", error, { method });
    throw error;
  }
}

// ── Account queries ───────────────────────────────────────────

export async function getAccountInfo(address: string, encoding = "jsonParsed") {
  return heliusRpc("getAccountInfo", [address, { encoding }]);
}

export async function getTokenLargestAccounts(mint: string) {
  return heliusRpc("getTokenLargestAccounts", [mint]);
}

// ── DAS (Digital Asset Standard) ─────────────────────────────

export async function getAssetMetadata(mint: string) {
  try {
    const res = await fetch(API_CONFIG.helius.rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "senju-das",
        method: "getAsset",
        params: { id: mint },
      }),
      signal: AbortSignal.timeout(API_CONFIG.helius.timeout),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data?.result || null;
  } catch (error) {
    logError("Failed to fetch DAS metadata", error, { mint });
    return null;
  }
}

// ── Enhanced Transactions API ─────────────────────────────────

/**
 * Fetch raw enhanced transaction history from Helius v0 API.
 * Returns unparsed records — use getTokenTransactions in token.service for parsed output.
 *
 * Previously buggy: extracted API key by splitting the RPC URL string.
 * Fixed: uses ENV.heliusApiKey directly.
 */
export async function getRawTransactionHistory(
  address: string,
  limit = 50,
): Promise<Array<Record<string, unknown>>> {
  try {
    const url = `${API_CONFIG.helius.api}/addresses/${address}/transactions?api-key=${ENV.heliusApiKey}&limit=${limit}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(API_CONFIG.helius.timeout),
    });

    if (!res.ok) return [];
    return (await res.json()) as Array<Record<string, unknown>>;
  } catch (error) {
    logError("Failed to fetch transaction history", error, { address, limit });
    return [];
  }
}
