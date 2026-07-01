/**
 * Fee mode detection registry.
 *
 * Reads the bonding curve account and agent PDA to determine which
 * fee mode a token uses. The result includes both the mode enum and
 * the full FeeModeInfo descriptor for direct use in API/UI.
 */

import { PublicKey } from "@solana/web3.js";
import { getAccountData, getAccountOwner } from "@/lib/platforms/rpc";
import { BONDING_CURVE } from "@/lib/constants";
import type { FeeMode, FeeModeResult } from "./types";
import { FEE_MODE_INFO } from "./types";

const PUMP_PROGRAM  = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
const AGENT_PROGRAM = new PublicKey("AgenTMiC2hvxGebTsgmsD4HHBa8WEcqGFf87iwRRxLo7");

/**
 * Detect the fee mode for a Pump.fun token.
 * Returns null if this isn't a Pump.fun token (no bonding curve account).
 */
export async function detectFeeMode(mint: string): Promise<FeeModeResult | null> {
  try {
    const mintKey = new PublicKey(mint);

    const [bcPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("bonding-curve"), mintKey.toBuffer()],
      PUMP_PROGRAM,
    );

    const [agentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("token-agent-payments"), mintKey.toBuffer()],
      AGENT_PROGRAM,
    );

    const [bcData, agentOwner] = await Promise.all([
      getAccountData(bcPda.toString()),
      getAccountOwner(agentPda.toString()),
    ]);

    if (!bcData || bcData.length < BONDING_CURVE.MIN_LENGTH) return null;

    const isMayhem   = bcData[BONDING_CURVE.OFFSET_MAYHEM]   === 1;
    const isCashback = bcData[BONDING_CURVE.OFFSET_CASHBACK] === 1;
    const isAgent    = agentOwner === AGENT_PROGRAM.toString();

    let mode: FeeMode = "creator";
    if (isMayhem)        mode = "mayhem";
    else if (isCashback) mode = "cashback";
    else if (isAgent)    mode = "agent";

    return {
      mode,
      info: FEE_MODE_INFO[mode],
    };
  } catch {
    return null;
  }
}

export { FEE_MODE_INFO };
export type { FeeMode, FeeModeResult, FeeModeInfo } from "./types";
