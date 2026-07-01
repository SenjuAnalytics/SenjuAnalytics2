import { PublicKey } from "@solana/web3.js";
import { getAccountData, getLamportBalance } from "@/lib/platforms/rpc";
import { getAllSignatures, batchParseTransactions, intersectSignatures } from "../helius";
import type { FeeSource, FeeClaimResult } from "../types";
import type { FeeClaimRecord } from "@/types/token";

/**
 * Bonding curve creator fee source (pump program).
 *
 * From pump-public-docs/PUMP_CREATOR_FEE_README.md:
 *   - BondingCurve account extended to 150 bytes with `creator: Pubkey` at offset 49.
 *   - Creator vault PDA seeds: ["creator-vault", bonding_curve.creator]
 *     Program: 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P
 *   - Vault holds native SOL (not WSOL ATA).
 *   - collectCreatorFee(creator) instruction transfers SOL from vault to creator.
 *   - All non-completed bonding curves receive creator fees on swaps.
 */

const PUMP_PROGRAM    = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
const DEFAULT_PUBKEY  = "11111111111111111111111111111111";
const BC_CREATOR_OFF  = 49;
const BC_MIN_LEN      = 81; // discriminator(8) + fields(40) + complete(1) + creator(32)

/** Read creator pubkey from bonding curve account. */
async function getBcCreator(mint: string): Promise<{
  creator: PublicKey;
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

    return { creator, bcPda: bcPda.toString() };
  } catch {
    return null;
  }
}

/** Derive the creator vault PDA (native SOL account). */
function deriveCreatorVault(creator: PublicKey): PublicKey {
  const [vault] = PublicKey.findProgramAddressSync(
    [Buffer.from("creator-vault"), creator.toBuffer()],
    PUMP_PROGRAM,
  );
  return vault;
}

async function getFeeClaims(mint: string): Promise<FeeClaimResult> {
  const result = await getBcCreator(mint);
  if (!result) return { claims: [], truncated: false };

  const { creator, bcPda } = result;
  const vault = deriveCreatorVault(creator);
  const vaultStr   = vault.toString();
  const creatorStr = creator.toString();

  console.log(`[pumpfun] mint=${mint.slice(0, 8)} creator=${creatorStr.slice(0, 8)} vault=${vaultStr.slice(0, 8)}`);

  /**
   * Intersection strategy: fetch signatures for both creator wallet and vault,
   * intersect to find only claim transactions, then batch-parse.
   * collectCreatorFee is signed by creator AND touches the vault.
   * Swaps deposit to vault but are signed by swapper (not creator).
   * So intersection = fee claim txns only.
   *
   * Both fetches are capped (see lib/fees/helius.ts MAX_SIGNATURE_PAGES) and run
   * in parallel, so wall-clock time is bounded even for very old/high-volume tokens.
   */
  const [creatorResult, vaultResult] = await Promise.all([
    getAllSignatures(creatorStr),
    getAllSignatures(vaultStr),
  ]);

  const claimSigs = intersectSignatures(creatorResult.signatures, vaultResult.signatures);
  const truncated = creatorResult.truncated || vaultResult.truncated;
  console.log(`[pumpfun] creator=${creatorResult.signatures.length} vault=${vaultResult.signatures.length} intersection=${claimSigs.length} truncated=${truncated}`);

  if (!claimSigs.length) return { claims: [], truncated };

  const txns = await batchParseTransactions(claimSigs);
  const claims: FeeClaimRecord[] = [];

  for (const tx of txns) {
    type NativeTransfer = { fromUserAccount: string; toUserAccount: string; amount: number };
    const nativeTransfers = (tx.nativeTransfers as NativeTransfer[]) ?? [];

    // collectCreatorFee transfers native SOL from creator vault to creator wallet
    const outgoing = nativeTransfers.find(t => t.fromUserAccount === vaultStr);
    if (!outgoing || outgoing.amount <= 0) continue;

    claims.push({
      signature:    tx.signature as string,
      timestamp:    tx.timestamp as number,
      amount:       outgoing.amount,
      amountSol:    outgoing.amount / 1e9,
      claimedBy:    outgoing.toUserAccount ?? creatorStr,
      vaultAddress: vaultStr,
      poolAddress:  bcPda,
      source:       "pumpfun",
    });
  }

  return { claims, truncated };
}

/** Unclaimed native SOL balance in the bonding curve creator vault. */
export async function getBcVaultBalance(mint: string): Promise<number> {
  try {
    const result = await getBcCreator(mint);
    if (!result) return 0;
    const vault = deriveCreatorVault(result.creator);
    const lamports = await getLamportBalance(vault.toString());
    // Subtract rent-exempt minimum (~890880 lamports) to show only claimable amount
    const RENT_EXEMPT_MIN = 890_880;
    return Math.max(lamports - RENT_EXEMPT_MIN, 0) / 1e9;
  } catch {
    return 0;
  }
}

/** Vault info for display. */
export async function getBcVaultInfo(
  mint: string,
): Promise<{ vaultAta: string; coinCreator: string; poolPda: string } | null> {
  try {
    const result = await getBcCreator(mint);
    if (!result) return null;
    const vault = deriveCreatorVault(result.creator);
    return {
      vaultAta:    vault.toString(),
      coinCreator: result.creator.toString(),
      poolPda:     result.bcPda,
    };
  } catch {
    return null;
  }
}

export const pumpfunFeeSource: FeeSource = {
  id:   "pumpfun",
  name: "Pump.fun",
  getFeeClaims,
};
