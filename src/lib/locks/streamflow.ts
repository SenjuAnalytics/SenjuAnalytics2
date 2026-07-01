/**
 * Streamflow lock detection via on-chain getProgramAccounts.
 *
 * Instead of scanning transaction history (unreliable, limited to recent txns),
 * we query the Streamflow program directly for all escrow accounts matching
 * our token mint. This gives us complete, accurate lock data.
 *
 * Streamflow Contract layout (strmRqUCoQUgGUan5YhzUZa6KqdzwX5L6FpUxfmKg5m):
 * Source: @streamflow/stream v6 — dist/solana/layout.js
 *
 *   0   magic              blob(8)
 *   8   version            blob(1)   ← NOT u64!
 *   9   created_at         blob(8)
 *   17  withdrawn_amount   blob(8)
 *   25  canceled_at        blob(8)
 *   33  end_time           blob(8)
 *   41  last_withdrawn_at  blob(8)
 *   49  sender             Pubkey (32)
 *   81  sender_tokens      Pubkey (32)
 *   113 recipient          Pubkey (32)
 *   145 recipient_tokens   Pubkey (32)
 *   177 mint               Pubkey (32)
 *   209 escrow_tokens      Pubkey (32)
 *   241 streamflow_treasury          Pubkey (32)
 *   273 streamflow_treasury_tokens   Pubkey (32)
 *   305 streamflow_fee_total         blob(8)
 *   313 streamflow_fee_withdrawn     blob(8)
 *   321 streamflow_fee_percent       f32 (4)
 *   325 partner            Pubkey (32)
 *   357 partner_tokens     Pubkey (32)
 *   389 partner_fee_total            blob(8)
 *   397 partner_fee_withdrawn        blob(8)
 *   405 partner_fee_percent          f32 (4)
 *   409 start_time         blob(8)
 *   417 net_amount_deposited blob(8)
 *   425 period             blob(8)
 *   433 amount_per_period  blob(8)
 *   441 cliff              blob(8)
 *   449 cliff_amount       blob(8)
 *   457 cancelable_by_sender    u8
 *   458 cancelable_by_recipient u8
 *   459 automatic_withdrawal    u8
 *   460 transferable_by_sender  u8
 *   461 transferable_by_recipient u8
 *   462 can_topup           u8
 *   463 stream_name         blob(64)
 *   527 withdraw_frequency  blob(8)
 */

import { PublicKey } from "@solana/web3.js";
import type { TokenLock } from "@/types/token";
import { API_CONFIG } from "@/config";

const HELIUS_RPC = API_CONFIG.helius.rpc;

export const STREAMFLOW_PROGRAM = "strmRqUCoQUgGUan5YhzUZa6KqdzwX5L6FpUxfmKg5m";

// ── Layout offsets ──────────────────────────────────────────

const SF_CREATED_AT    = 9;
const SF_WITHDRAWN     = 17;
const SF_CANCELED_AT   = 25;
const SF_END_TIME      = 33;
const SF_SENDER        = 49;
const SF_RECIPIENT     = 113;
const SF_MINT          = 177;
const SF_START_TIME    = 409;
const SF_NET_DEPOSITED = 417;
const SF_PERIOD        = 425;
const SF_CLIFF         = 441;
const SF_MIN_LEN       = 535;

// ── Helpers ─────────────────────────────────────────────────

function readU64(buf: Buffer, off: number): number {
  const lo = buf.readUInt32LE(off);
  const hi = buf.readUInt32LE(off + 4);
  return lo + hi * 0x100000000;
}

function readPubkey(buf: Buffer, off: number): string {
  return new PublicKey(buf.subarray(off, off + 32)).toString();
}

// ── Main export ─────────────────────────────────────────────

export async function getStreamflowLocks(mint: string): Promise<TokenLock[]> {
  try {
    const res = await fetch(HELIUS_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "sf-locks",
        method: "getProgramAccounts",
        params: [
          STREAMFLOW_PROGRAM,
          {
            encoding: "base64",
            filters: [
              { memcmp: { offset: SF_MINT, bytes: mint } },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      console.error(`[locks/streamflow] RPC error: ${res.status}`);
      return [];
    }

    const data = await res.json();
    if (data.error) {
      console.error("[locks/streamflow] RPC error:", data.error);
      return [];
    }
    if (!data.result || !Array.isArray(data.result)) return [];

    const now = Math.floor(Date.now() / 1000);
    const locks: TokenLock[] = [];

    for (const account of data.result) {
      try {
        const buf = Buffer.from(account.account.data[0], "base64");
        if (buf.length < SF_MIN_LEN) continue;

        const createdAt      = readU64(buf, SF_CREATED_AT);
        const withdrawnAmt   = readU64(buf, SF_WITHDRAWN);
        const canceledAt     = readU64(buf, SF_CANCELED_AT);
        const endTime        = readU64(buf, SF_END_TIME);
        const sender         = readPubkey(buf, SF_SENDER);
        const recipient      = readPubkey(buf, SF_RECIPIENT);
        const netDeposited   = readU64(buf, SF_NET_DEPOSITED);
        const startTime      = readU64(buf, SF_START_TIME);
        const period         = readU64(buf, SF_PERIOD);
        const cliff          = readU64(buf, SF_CLIFF);

        const currentAmount = netDeposited - withdrawnAmt;
        const isCanceled    = canceledAt > 0;
        const isExpired     = endTime > 0 && endTime <= now;
        const isFullyWithdrawn = withdrawnAmt >= netDeposited;
        const isUnlocked    = isCanceled || isExpired || isFullyWithdrawn;

        // Build vesting schedule if it's a stream (period > 0)
        let vestingSchedule: TokenLock["vestingSchedule"];
        if (period > 0 && endTime > startTime) {
          vestingSchedule = {
            cliff: cliff > 0 ? cliff : undefined,
            duration: endTime - startTime,
            periods: Math.ceil((endTime - startTime) / period),
          };
        }

        locks.push({
          id: account.pubkey,
          programName: "Streamflow",
          programId: STREAMFLOW_PROGRAM,
          amount: currentAmount,
          amountDeposited: netDeposited,
          unlockDate: endTime > 0 ? endTime : undefined,
          startTime: startTime > 0 ? startTime : undefined,
          owner: sender,
          recipient,
          isUnlocked,
          vestingSchedule,
          lockAddress: account.pubkey,
          createdAt,
        });
      } catch {
        // Skip malformed accounts
      }
    }

    // Sort: active locks first, then by amount descending
    locks.sort((a, b) => {
      if (a.isUnlocked !== b.isUnlocked) return a.isUnlocked ? 1 : -1;
      return b.amount - a.amount;
    });

    console.log(`[locks/streamflow] found ${locks.length} lock(s) for ${mint.slice(0, 8)}`);
    return locks;
  } catch (err) {
    console.error("[locks/streamflow] error:", err);
    return [];
  }
}
