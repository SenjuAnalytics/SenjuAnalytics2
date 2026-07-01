import { API_CONFIG } from "@/config";

const HELIUS_RPC = API_CONFIG.helius.rpc;

/**
 * Returns the token account balance in lamports (u64 as string → number).
 * Returns 0 if the account doesn't exist or on RPC error.
 */
export async function getTokenBalance(pubkey: string): Promise<number> {
  try {
    const res = await fetch(HELIUS_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: "tok-bal", method: "getTokenAccountBalance",
        params: [pubkey],
      }),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return 0;
    const json = await res.json();
    return Number(json?.result?.value?.amount ?? 0);
  } catch {
    return 0;
  }
}

export async function getAccountOwner(pubkey: string): Promise<string | null> {
  try {
    const res = await fetch(HELIUS_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: "plat", method: "getAccountInfo",
        params: [pubkey, { encoding: "base64" }],
      }),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.result?.value?.owner ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch current SOL/USD price from Binance public API.
 * Returns 0 if the fetch fails.
 */
export async function getSolPriceUsd(): Promise<number> {
  try {
    const res = await fetch(
      "https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT",
      { signal: AbortSignal.timeout(5_000) },
    );
    if (!res.ok) return 0;
    const data = await res.json();
    const price = Number(data?.price);
    return Number.isFinite(price) && price > 0 ? price : 0;
  } catch {
    return 0;
  }
}

/**
 * Returns the native SOL balance (lamports) of an account.
 * Returns 0 if the account doesn't exist or on RPC error.
 */
export async function getLamportBalance(pubkey: string): Promise<number> {
  try {
    const res = await fetch(HELIUS_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: "bal", method: "getBalance",
        params: [pubkey],
      }),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return 0;
    const json = await res.json();
    return Number(json?.result?.value ?? 0);
  } catch {
    return 0;
  }
}

/**
 * Returns the blockTime (unix seconds) of the earliest transaction for an account.
 * Used to determine when a pool/account was created on-chain.
 */
export async function getAccountCreationTime(pubkey: string): Promise<number | undefined> {
  try {
    let before: string | undefined;
    let oldest: number | undefined;

    for (let i = 0; i < 5; i++) {
      const params: [string, Record<string, unknown>] = [pubkey, { limit: 1000 }];
      if (before) params[1].before = before;

      const res = await fetch(HELIUS_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: "creation", method: "getSignaturesForAddress",
          params,
        }),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) break;
      const json = await res.json();
      const sigs = json?.result as { signature: string; blockTime?: number }[] | undefined;
      if (!sigs || sigs.length === 0) break;

      oldest = sigs[sigs.length - 1].blockTime ?? oldest;
      if (sigs.length < 1000) break; // reached the end
      before = sigs[sigs.length - 1].signature;
    }

    return oldest;
  } catch {
    return undefined;
  }
}

/**
 * Fetch raw account data as a Buffer.
 * Returns null if the account does not exist or on RPC error.
 */
export async function getAccountData(pubkey: string): Promise<Buffer | null> {
  try {
    const res = await fetch(HELIUS_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: "plat-data", method: "getAccountInfo",
        params: [pubkey, { encoding: "base64" }],
      }),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const b64 = json?.result?.value?.data?.[0];
    if (!b64) return null;
    return Buffer.from(b64, "base64");
  } catch {
    return null;
  }
}
