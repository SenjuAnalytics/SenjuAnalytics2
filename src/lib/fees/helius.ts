/**
 * Shared Helius utilities for efficient transaction fetching.
 *
 * Key improvement over the old approach:
 *   Old: Helius enhanced transactions API → 100/page, slow, capped at ~2000 txns
 *   New: getSignaturesForAddress RPC → 1000/page, fast, then batch-parse only relevant txns
 *
 * The "intersection" strategy:
 *   1. Fetch signatures for both creator wallet and fee vault (capped — see MAX_SIGNATURE_PAGES)
 *   2. Intersect → only transactions involving BOTH are fee claims
 *   3. Batch-parse only those (typically <500 txns) via Helius enhanced API
 *
 * Performance note — very old / high-volume tokens:
 *   getSignaturesForAddress pagination is cursor-based and therefore inherently
 *   SEQUENTIAL within a single address — Solana RPC has no offset-based or
 *   parallel pagination (page N's cursor only exists once page N-1 has been
 *   fetched). For a token that has traded heavily over a long period, the fee
 *   vault alone can accumulate tens of thousands of signatures (every swap
 *   deposits a fee into it, not just claims), which previously meant unbounded
 *   sequential round-trips and very slow — or timed-out — loads.
 *
 *   MAX_SIGNATURE_PAGES below bounds this: we fetch the most recent N pages
 *   (newest-first, which is what a claims-history view actually needs) and
 *   report `truncated: true` if older history exists beyond that window,
 *   instead of silently hanging. Creator + vault fetches still run in
 *   parallel (see sources/pumpfun.ts, sources/pumpswap.ts), so wall-clock
 *   time is bounded by whichever of the two is larger, not their sum.
 */

import { API_CONFIG, ENV } from "@/config";

const HELIUS_RPC = API_CONFIG.helius.rpc;
const HELIUS_V0  = API_CONFIG.helius.api;

/** Pages (1000 sigs/page) fetched per address before we stop and report truncation.
 *  20 pages ⇒ up to 20,000 signatures/address — generous for the vast majority of
 *  tokens, while bounding worst-case latency for pathological cases. */
const MAX_SIGNATURE_PAGES = 20;

export interface SignatureResult {
  signatures: string[];
  /** True if older signatures exist beyond MAX_SIGNATURE_PAGES (history may be incomplete). */
  truncated: boolean;
}

/**
 * Fetch transaction signatures for an address using Solana RPC.
 * Paginates newest → oldest, capped at MAX_SIGNATURE_PAGES for bounded latency.
 * Only returns successful (non-errored) transaction signatures.
 *
 * @param until  Optional signature cursor — stop once this signature is reached.
 *               Reserved for future incremental/cached fetching (not used yet);
 *               accepted now so callers don't need this function's shape to change later.
 */
export async function getAllSignatures(
  address: string,
  until?: string,
): Promise<SignatureResult> {
  const sigs: string[] = [];
  let before: string | undefined;
  let page = 0;
  let truncated = false;

  for (;;) {
    if (page >= MAX_SIGNATURE_PAGES) {
      truncated = true;
      break;
    }
    page++;

    try {
      const params: Record<string, unknown> = { limit: 1000 };
      if (before) params.before = before;
      if (until)  params.until  = until;

      const res = await fetch(HELIUS_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "sigs",
          method: "getSignaturesForAddress",
          params: [address, params],
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) break;

      const data = await res.json();
      const arr = data.result as {
        signature: string;
        err: unknown;
      }[];
      if (!arr?.length) break;

      for (const s of arr) {
        if (!s.err) sigs.push(s.signature);
      }

      if (arr.length < 1000) break;
      before = arr[arr.length - 1].signature;
    } catch {
      break;
    }
  }

  return { signatures: sigs, truncated };
}

/**
 * Batch-parse transaction signatures using Helius enhanced transactions API.
 * Sends up to 100 signatures per request with limited concurrency.
 *
 * Default concurrency raised 3 → 6: this is the parsing phase, not pagination,
 * so it's safely parallelizable. If you're on Helius's free tier and start
 * seeing 429s here, lower this back down — paid tiers handle 6 comfortably.
 */
export async function batchParseTransactions(
  signatures: string[],
  concurrency = 6,
): Promise<Record<string, unknown>[]> {
  const BATCH_SIZE = 100;
  const all: Record<string, unknown>[] = [];
  const batches: string[][] = [];

  for (let i = 0; i < signatures.length; i += BATCH_SIZE) {
    batches.push(signatures.slice(i, i + BATCH_SIZE));
  }

  for (let i = 0; i < batches.length; i += concurrency) {
    const chunk = batches.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      chunk.map(async (batch) => {
        const res = await fetch(
          `${HELIUS_V0}/transactions?api-key=${ENV.heliusApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transactions: batch }),
            signal: AbortSignal.timeout(15_000),
          },
        );
        if (!res.ok) return [];
        return (await res.json()) as Record<string, unknown>[];
      }),
    );

    for (const r of results) {
      if (r.status === "fulfilled" && Array.isArray(r.value)) {
        all.push(...r.value);
      }
    }
  }

  return all;
}

/**
 * Return signatures that appear in BOTH arrays.
 * Used to find fee-claim transactions: only txns involving both the
 * creator wallet AND the fee vault are actual claims.
 */
export function intersectSignatures(a: string[], b: string[]): string[] {
  const setB = new Set(b);
  return a.filter((s) => setB.has(s));
}
