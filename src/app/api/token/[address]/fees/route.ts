import { getAllFeeClaims, detectFeeMode, getCreatorVaultData, getAgentStats } from "@/lib/fees";
import { getSolPrice } from "@/services/token.service";
import { logError } from "@/lib/error-logger";
import type { NextRequest } from "next/server";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ address: string }> }) {
  const { address } = await ctx.params;

  try {
    const [feeResult, modeResult, vaultData, solPrice] = await Promise.all([
      getAllFeeClaims(address),
      detectFeeMode(address),
      getCreatorVaultData(address),
      getSolPrice(),
    ]);

    const { claims: fees, truncated } = feeResult;
    const feeMode  = modeResult?.mode ?? "creator";
    const modeInfo = modeResult?.info ?? null;

    // Enrich with USD value if SOL price is available
    if (solPrice > 0) {
      for (const fee of fees) {
        if (!fee.usdValue) {
          const sol = fee.amountSol ?? fee.amount / 1e9;
          fee.usdValue = sol * solPrice;
        }
      }
    }

    let agentStats = null;
    if (feeMode === "agent") {
      agentStats = await getAgentStats(address);
    }

    return Response.json({
      fees,
      truncated,
      unclaimedSol: vaultData.unclaimedSol,
      vaultInfo:    vaultData.vaultInfo,
      feeMode,
      modeInfo,
      agentStats,
    });
  } catch (error) {
    logError("Failed to fetch fee records", error, { address });
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to fetch fee records" },
      { status: 500 },
    );
  }
}
