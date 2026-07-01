import { PublicKey } from "@solana/web3.js";
import { getAccountData, getTokenBalance } from "@/lib/platforms/rpc";
import { getAllSignatures, batchParseTransactions, intersectSignatures } from "../helius";
import type { FeeSource, FeeClaimResult } from "../types";
import type { FeeClaimRecord } from "@/types/token";

const PUMP_PROGRAM   = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
const AMM_PROGRAM    = new PublicKey("pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA");
const WSOL           = new PublicKey("So11111111111111111111111111111111111111112");
const ATA_PROGRAM    = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const TOKEN_PROG     = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const DEFAULT_PUBKEY = "11111111111111111111111111111111";

/**
 * Pool struct byte layout (Anchor, 8-byte discriminator prefix):
 *   0-7:   discriminator
 *   8:     pool_bump (u8)
 *   9-10:  index (u16 LE)
 *   11-42: creator (Pubkey)
 *   43-74: base_mint (Pubkey)
 *   75-106: quote_mint (Pubkey)
 *   107-138: lp_mint (Pubkey)
 *   139-170: pool_base_token_account (Pubkey)
 *   171-202: pool_quote_token_account (Pubkey)
 *   203-210: lp_supply (u64 LE)
 *   211-242: coin_creator (Pubkey) — set only for canonical pools
 * Source: pump-public-docs PUMP_SWAP_CREATOR_FEE_README.md
 */
const COIN_CREATOR_OFFSET = 211;


/**
 * Derive the canonical PumpSwap pool PDA and extract its coin_creator.
 *
 * From pump-public-docs/PUMP_SWAP_README.md:
 *   Pool PDA seeds: ["pool", index(u16 LE), creator, baseMint, quoteMint]
 *
 * For canonical pools (graduated from pump.fun bonding curve):
 *   creator = pump_pool_authority_pda(base_mint)
 *           = findPDA(["pool-authority", base_mint], PUMP_PROGRAM=6EF8...)
 *   index   = 0  (CANONICAL_POOL_INDEX)
 *
 * Source: https://github.com/pump-fun/pump-public-docs
 */
async function getPoolCoinCreator(
  mint: string,
): Promise<{ poolPda: string; coinCreator: PublicKey } | null> {
  try {
    const mintKey = new PublicKey(mint);

    const [pumpPoolAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool-authority"), mintKey.toBuffer()],
      PUMP_PROGRAM,
    );

    const indexBuf = Buffer.alloc(2);
    indexBuf.writeUInt16LE(0, 0);

    const [poolPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("pool"),
        indexBuf,                       // index FIRST (u16 LE) per docs
        pumpPoolAuthority.toBuffer(),   // creator = pump_pool_authority
        mintKey.toBuffer(),             // baseMint
        WSOL.toBuffer(),                // quoteMint
      ],
      AMM_PROGRAM,
    );

    const data = await getAccountData(poolPda.toString());
    if (!data || data.length < COIN_CREATOR_OFFSET + 32) return null;

    const coinCreator = new PublicKey(
      data.slice(COIN_CREATOR_OFFSET, COIN_CREATOR_OFFSET + 32),
    );
    if (coinCreator.toBase58() === DEFAULT_PUBKEY) return null;

    return { poolPda: poolPda.toString(), coinCreator };
  } catch {
    return null;
  }
}

async function getFeeClaims(mint: string): Promise<FeeClaimResult> {
  const result = await getPoolCoinCreator(mint);
  console.log(`[pumpswap] mint=${mint.slice(0,8)} poolResult=`, result ? { poolPda: result.poolPda.slice(0,8), coinCreator: result.coinCreator.toBase58().slice(0,8) } : null);
  if (!result) return { claims: [], truncated: false };

  const { poolPda, coinCreator } = result;

  /**
   * From pump-public-docs/PUMP_SWAP_CREATOR_FEE_README.md:
   *   coin_creator_vault_authority = findPDA(["creator_vault", coin_creator], AMM_PROGRAM)
   *   coin_creator_vault_ata       = ATA(vault_authority, WSOL)  ← holds the WSOL fees
   */
  const [vaultAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from("creator_vault"), coinCreator.toBuffer()],
    AMM_PROGRAM,
  );

  const [vaultAta] = PublicKey.findProgramAddressSync(
    [vaultAuthority.toBuffer(), TOKEN_PROG.toBuffer(), WSOL.toBuffer()],
    ATA_PROGRAM,
  );

  const vaultAtaStr       = vaultAta.toString();
  const vaultAuthorityStr = vaultAuthority.toString();

  /**
   * Intersection strategy: fetch signatures for both creator wallet and vault ATA,
   * intersect to find only claim transactions (txns involving both), then batch-parse.
   * This gives complete historical coverage regardless of creator wallet activity.
   *
   * Why: collectCoinCreatorFee is signed by coinCreator AND touches the vault ATA.
   * Swaps only touch the vault ATA (not creator). Creator's other txns don't touch vault.
   * So intersection = fee claim txns only.
   */
  const creatorStr = coinCreator.toString();
  console.log(`[pumpswap] fetching signatures for creator=${creatorStr.slice(0,8)} and vault=${vaultAtaStr.slice(0,8)}`);

  const [creatorResult, vaultResult] = await Promise.all([
    getAllSignatures(creatorStr),
    getAllSignatures(vaultAtaStr),
  ]);

  const claimSigs = intersectSignatures(creatorResult.signatures, vaultResult.signatures);
  const truncated = creatorResult.truncated || vaultResult.truncated;
  console.log(`[pumpswap] creator=${creatorResult.signatures.length} vault=${vaultResult.signatures.length} intersection=${claimSigs.length} truncated=${truncated}`);

  if (!claimSigs.length) return { claims: [], truncated };

  const txns = await batchParseTransactions(claimSigs);
  const claims: FeeClaimRecord[] = [];

  for (const tx of txns) {
    type NativeTransfer = { fromUserAccount: string; toUserAccount: string; amount: number };
    type TokenTransfer  = {
      fromUserAccount: string; toUserAccount: string;
      fromTokenAccount: string; toTokenAccount: string;
      tokenAmount: number; mint: string;
    };

    const nativeTransfers = (tx.nativeTransfers  as NativeTransfer[])  ?? [];
    const tokenTransfers  = (tx.tokenTransfers   as TokenTransfer[])   ?? [];

    // When creator calls collectCoinCreatorFee, WSOL is transferred FROM vaultAta
    const outgoingSol  = nativeTransfers.find(t => t.fromUserAccount === vaultAuthorityStr);
    const outgoingWsol = tokenTransfers.find(t  => t.fromTokenAccount === vaultAtaStr);

    const solAmount  = outgoingSol?.amount ?? 0;
    const wsolAmount = outgoingWsol ? Math.round(outgoingWsol.tokenAmount * 1e9) : 0;
    const amount     = solAmount > 0 ? solAmount : wsolAmount;
    if (amount <= 0) continue;

    const recipient = outgoingSol?.toUserAccount ?? outgoingWsol?.toUserAccount ?? creatorStr;

    claims.push({
      signature:    tx.signature as string,
      timestamp:    tx.timestamp as number,
      amount,
      amountSol:    amount / 1e9,
      claimedBy:    recipient,
      vaultAddress: vaultAtaStr,
      poolAddress:  poolPda,
      source:       "pumpswap",
    });
  }

  return { claims, truncated };
}

function deriveVaultAddresses(coinCreator: PublicKey): { vaultAuthority: PublicKey; vaultAta: PublicKey } {
  const [vaultAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from("creator_vault"), coinCreator.toBuffer()],
    AMM_PROGRAM,
  );
  const [vaultAta] = PublicKey.findProgramAddressSync(
    [vaultAuthority.toBuffer(), TOKEN_PROG.toBuffer(), WSOL.toBuffer()],
    ATA_PROGRAM,
  );
  return { vaultAuthority, vaultAta };
}

/** Returns the current unclaimed WSOL balance in the creator vault ATA (in SOL). */
export async function getVaultBalance(mint: string): Promise<number> {
  try {
    const result = await getPoolCoinCreator(mint);
    if (!result) return 0;
    const { vaultAta } = deriveVaultAddresses(result.coinCreator);
    const lamports = await getTokenBalance(vaultAta.toString());
    return lamports / 1e9;
  } catch {
    return 0;
  }
}

/** Returns vault ATA and coinCreator addresses for display purposes. */
export async function getVaultInfo(
  mint: string,
): Promise<{ vaultAta: string; coinCreator: string; poolPda: string } | null> {
  try {
    const result = await getPoolCoinCreator(mint);
    if (!result) return null;
    const { vaultAta } = deriveVaultAddresses(result.coinCreator);
    return {
      vaultAta:    vaultAta.toString(),
      coinCreator: result.coinCreator.toString(),
      poolPda:     result.poolPda,
    };
  } catch {
    return null;
  }
}

export const pumpswapFeeSource: FeeSource = {
  id:   "pumpswap",
  name: "PumpSwap",
  getFeeClaims,
};

