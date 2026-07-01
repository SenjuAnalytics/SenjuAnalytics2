/**
 * Cashback fee mode — distribution tracking and accumulator utilities.
 *
 * From pump-fun/pump-public-docs/PUMP_CASHBACK_README.md:
 *
 *   Bonding Curve (Pump program):
 *     - Cashback accumulates as native SOL in UserVolumeAccumulator PDA
 *     - Seeds: ["user_volume_accumulator", user_wallet] + PUMP_PROGRAM
 *     - Unclaimed = lamports in accumulator − rent-exempt minimum
 *     - claim_cashback instruction → transfers native SOL to user wallet
 *     - claim_cashback is GLOBAL per user (no token account), claims ALL
 *       accumulated cashback from ALL cashback tokens
 *
 *   PumpSwap (AMM program):
 *     - Cashback accumulates as WSOL in ATA of UserVolumeAccumulator PDA
 *     - Seeds: ["user_volume_accumulator", user_wallet] + AMM_PROGRAM
 *     - Unclaimed = WSOL balance in that ATA
 *     - claim_cashback instruction → transfers WSOL to user's WSOL ATA
 *
 * Note: UserVolumeAccumulator is per-user (not per-token). Cashback from
 * ALL cashback-enabled tokens accumulates into the same account per user.
 *
 * We track per-token distributions by scanning the bonding curve transaction
 * history. During each trade, the creator fee portion is sent to the trader's
 * accumulator instead of the creator vault. We identify these by excluding
 * transfers to: protocol fee recipients, creator vault, and the trade signer.
 */

import { PublicKey } from "@solana/web3.js";
import { getAccountData, getLamportBalance, getTokenBalance } from "@/lib/platforms/rpc";
import { API_CONFIG, ENV } from "@/config";
import type { CashbackStats, CashbackDistributionRecord } from "./types";

const PUMP_PROGRAM = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
const AMM_PROGRAM  = new PublicKey("pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA");
const WSOL         = new PublicKey("So11111111111111111111111111111111111111112");
const ATA_PROGRAM  = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const TOKEN_PROG   = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

const RENT_EXEMPT_MIN = 890_880; // lamports

const BC_CREATOR_OFF = 49;
const BC_MIN_LEN     = 81;
const DEFAULT_PUBKEY = "11111111111111111111111111111111";

const HELIUS_V0 = API_CONFIG.helius.api;

// Known protocol fee recipients — NOT cashback
const PROTOCOL_RECIPIENTS = new Set([
  "62qc2CNXwrYqQScmEdiZFFAnJR262PxWEuNQtxfafNgV",
  "7VtfL8fvgNfhz17qKRMjzQEXgbdpnHHHQRh54R9jP2RJ",
  "7hTckgnGnLQR6sdH7YkqFTAA7VwTfYFaZ6EhEsU3saCX",
  "9rPYyANsfQZw3DnDmKE3YCQF5E8oD89UXoHn9JFEhJUz",
  "AVmoTthdrX6tKt4nDjco2D775W2YK3sDhxPcMmzUAmTY",
  "CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM",
  "FWsW1xNtWscwNmKv6wVsU1iTzRN6wmmk3MjxRP5tT7hz",
  "G5UZAVbAf46s7cKWoyKu8kYTip9DGTpbLZ2qa9Aq69dP",
]);

// ── PDA derivations ──────────────────────────────────────────

/** Derive Pump program UserVolumeAccumulator for a wallet. */
export function derivePumpAccumulator(wallet: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("user_volume_accumulator"), wallet.toBuffer()],
    PUMP_PROGRAM,
  );
  return pda;
}

/** Derive PumpSwap UserVolumeAccumulator + its WSOL ATA for a wallet. */
export function deriveSwapAccumulator(wallet: PublicKey): { accumulator: PublicKey; wsolAta: PublicKey } {
  const [accumulator] = PublicKey.findProgramAddressSync(
    [Buffer.from("user_volume_accumulator"), wallet.toBuffer()],
    AMM_PROGRAM,
  );
  const [wsolAta] = PublicKey.findProgramAddressSync(
    [accumulator.toBuffer(), TOKEN_PROG.toBuffer(), WSOL.toBuffer()],
    ATA_PROGRAM,
  );
  return { accumulator, wsolAta };
}

// ── Per-user unclaimed balance ───────────────────────────────

/**
 * Read unclaimed cashback for a specific wallet (cross-token).
 * Returns total across Pump + PumpSwap accumulators (in SOL).
 */
export async function getUnclaimedCashback(wallet: string): Promise<{
  pumpSol: number;
  swapSol: number;
  totalSol: number;
}> {
  try {
    const walletKey = new PublicKey(wallet);
    const pumpAcc = derivePumpAccumulator(walletKey);
    const { wsolAta } = deriveSwapAccumulator(walletKey);

    const [pumpLamports, swapLamports] = await Promise.all([
      getLamportBalance(pumpAcc.toString()).catch(() => 0),
      getTokenBalance(wsolAta.toString()).catch(() => 0),
    ]);

    const pumpSol = Math.max(pumpLamports - RENT_EXEMPT_MIN, 0) / 1e9;
    const swapSol = swapLamports / 1e9;

    return { pumpSol, swapSol, totalSol: pumpSol + swapSol };
  } catch {
    return { pumpSol: 0, swapSol: 0, totalSol: 0 };
  }
}

// ── Internal helpers ─────────────────────────────────────────

/** Read creator pubkey from bonding curve account. */
async function getBcCreator(mint: string): Promise<{
  creator: string;
  creatorVault: string;
  bcPda: string;
} | null> {
  try {
    const mintKey = new PublicKey(mint);
    const [bcPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("bonding-curve"), mintKey.toBuffer()],
      PUMP_PROGRAM,
    );

    const data = await getAccountData(bcPda.toString());
    if (!data || data.length < BC_MIN_LEN) return null;

    const creator = new PublicKey(data.slice(BC_CREATOR_OFF, BC_CREATOR_OFF + 32));
    if (creator.toBase58() === DEFAULT_PUBKEY) return null;

    const [vault] = PublicKey.findProgramAddressSync(
      [Buffer.from("creator-vault"), creator.toBuffer()],
      PUMP_PROGRAM,
    );

    return {
      creator: creator.toString(),
      creatorVault: vault.toString(),
      bcPda: bcPda.toString(),
    };
  } catch {
    return null;
  }
}

/** Fetch Helius enhanced transactions for an address. */
async function fetchTxns(address: string, maxPages = 5): Promise<Record<string, unknown>[]> {
  const all: Record<string, unknown>[] = [];
  let before: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    try {
      const url = new URL(`${HELIUS_V0}/addresses/${address}/transactions`);
      url.searchParams.set("api-key", ENV.heliusApiKey);
      url.searchParams.set("limit", "100");
      if (before) url.searchParams.set("before", before);

      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
      if (!res.ok) break;

      const txns = (await res.json()) as Record<string, unknown>[];
      if (!txns.length) break;
      all.push(...txns);
      if (txns.length < 100) break;
      before = txns[txns.length - 1].signature as string;
    } catch {
      break;
    }
  }
  return all;
}

// ── Per-token cashback distribution scanning ─────────────────

/**
 * Scan bonding curve transactions to find cashback distributions for
 * a specific token.
 *
 * During each trade on a cashback-enabled token, the creator fee
 * portion is sent to the trader's UserVolumeAccumulator instead of
 * the creator vault. We identify these transfers by:
 *
 *   1. Getting all native transfers FROM the bonding curve
 *   2. Excluding transfers to:
 *      - Protocol fee recipients (known set)
 *      - Creator vault (derived from BC account)
 *      - The transaction signer/feePayer (trade output in sells)
 *   3. The remaining transfers = cashback to accumulator PDAs
 */
export async function getCashbackStats(mint: string): Promise<CashbackStats> {
  const empty: CashbackStats = {
    uniqueRecipients: 0,
    totalDistributedSol: 0,
    totalDistributions: 0,
    distributions: [],
  };

  try {
    // Derive bonding curve PDA and creator vault
    const bcInfo = await getBcCreator(mint);
    if (!bcInfo) return empty;

    const { creatorVault, bcPda } = bcInfo;

    // Build exclusion set: protocol recipients + creator vault
    const excludeSet = new Set([...PROTOCOL_RECIPIENTS, creatorVault]);

    // Scan bonding curve transaction history
    const txns = await fetchTxns(bcPda, 10);

    type NativeTransfer = { fromUserAccount: string; toUserAccount: string; amount: number };

    const accumulatorSet = new Set<string>();
    const distributions: CashbackDistributionRecord[] = [];

    for (const tx of txns) {
      const nativeTransfers = (tx.nativeTransfers as NativeTransfer[]) ?? [];
      const feePayer = tx.feePayer as string | undefined;

      for (const t of nativeTransfers) {
        // Only transfers FROM the bonding curve
        if (t.fromUserAccount !== bcPda) continue;
        if (t.amount <= 0) continue;

        // Skip protocol recipients and creator vault
        if (excludeSet.has(t.toUserAccount)) continue;

        // Skip transfers to the signer (trade output in sells)
        if (feePayer && t.toUserAccount === feePayer) continue;

        // What remains: cashback to UserVolumeAccumulator PDAs
        const amountSol = t.amount / 1e9;
        accumulatorSet.add(t.toUserAccount);
        distributions.push({
          signature: tx.signature as string,
          timestamp: tx.timestamp as number,
          accumulator: t.toUserAccount,
          amountSol,
          source: "pump",
        });
      }
    }

    const totalDistributedSol = distributions.reduce((sum, d) => sum + d.amountSol, 0);

    console.log(
      `[cashback] ${mint.slice(0, 8)} → ${distributions.length} distributions, ` +
      `${accumulatorSet.size} unique recipients, ${totalDistributedSol.toFixed(6)} SOL total`,
    );

    return {
      uniqueRecipients: accumulatorSet.size,
      totalDistributedSol,
      totalDistributions: distributions.length,
      distributions: distributions.sort((a, b) => b.timestamp - a.timestamp),
    };
  } catch (e) {
    console.error("[cashback] getCashbackStats error:", e);
    return empty;
  }
}
