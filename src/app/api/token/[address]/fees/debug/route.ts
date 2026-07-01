import { PublicKey } from "@solana/web3.js";
import { getAccountData } from "@/lib/platforms/rpc";
import type { NextRequest } from "next/server";

const PUMP_PROGRAM   = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
const AMM_PROGRAM    = new PublicKey("pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA");
const WSOL           = new PublicKey("So11111111111111111111111111111111111111112");
const ATA_PROGRAM    = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const TOKEN_PROG     = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const DEFAULT_PUBKEY = "11111111111111111111111111111111";
const COIN_CREATOR_OFFSET = 211;
const HELIUS_KEY = process.env.HELIUS_API_KEY ?? ""; // debug-only, not for production routes
const HELIUS_V0  = "https://api.helius.xyz/v0";    // debug-only, use API_CONFIG in production routes

export async function GET(_req: NextRequest, ctx: { params: Promise<{ address: string }> }) {
  const { address } = await ctx.params;

  try {
    const mintKey = new PublicKey(address);

    const [pumpPoolAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool-authority"), mintKey.toBuffer()],
      PUMP_PROGRAM,
    );
    const indexBuf = Buffer.alloc(2);
    indexBuf.writeUInt16LE(0, 0);
    const [poolPdaKey] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), indexBuf, pumpPoolAuthority.toBuffer(), mintKey.toBuffer(), WSOL.toBuffer()],
      AMM_PROGRAM,
    );
    const poolPda = poolPdaKey.toString();

    const poolData    = await getAccountData(poolPda);
    const poolDataLen = poolData?.length ?? 0;

    const coinCreatorBytes = poolData && poolData.length >= COIN_CREATOR_OFFSET + 32
      ? poolData.slice(COIN_CREATOR_OFFSET, COIN_CREATOR_OFFSET + 32)
      : null;
    const coinCreator = coinCreatorBytes ? new PublicKey(coinCreatorBytes).toBase58() : null;

    let vaultAtaStr: string | null = null;

    if (coinCreator && coinCreator !== DEFAULT_PUBKEY) {
      const creatorKey = new PublicKey(coinCreator);
      const [vaultAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from("creator_vault"), creatorKey.toBuffer()],
        AMM_PROGRAM,
      );
      const [vaultAta] = PublicKey.findProgramAddressSync(
        [vaultAuthority.toBuffer(), TOKEN_PROG.toBuffer(), WSOL.toBuffer()],
        ATA_PROGRAM,
      );
      // vaultAuthority (PDA) computed for completeness; only the ATA is returned in debug payload
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _vaultAuthorityStr = vaultAuthority.toString();
      vaultAtaStr = vaultAta.toString();
    }

    const vaultAccountStr = vaultAtaStr;

    let txSample: unknown[] = [];
    if (vaultAccountStr) {
      const res = await fetch(
        `${HELIUS_V0}/addresses/${vaultAccountStr}/transactions?api-key=${HELIUS_KEY}&limit=3`,
        { signal: AbortSignal.timeout(5000) },
      );
      if (res.ok) {
        const txns = await res.json() as Record<string, unknown>[];
        txSample = txns.map(tx => ({
          sig:           (tx.signature as string)?.slice(0, 12),
          type:          tx.type,
          nativeTransfers: (tx.nativeTransfers as unknown[] | undefined)?.slice(0, 2),
          tokenTransfers:  (tx.tokenTransfers  as unknown[] | undefined)?.slice(0, 2),
        }));
      }
    }

    return Response.json({
      mint: address,
      poolPda,
      poolDataLen,
      coinCreator,
      coinCreatorIsDefault: coinCreator === DEFAULT_PUBKEY,
      vaultAccount: vaultAccountStr,
      txSample,
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
