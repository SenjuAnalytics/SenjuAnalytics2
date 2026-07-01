import { getLiquidityPools, getTokenInfo, getSolPrice } from "@/services/token.service";
import { getPumpSwapPool, getBondingCurvePool } from "@/lib/platforms/pumpfun";
import { logError } from "@/lib/error-logger";
import type { NextRequest } from "next/server";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ address: string }> }) {
  const { address } = await ctx.params;

  try {
    const pools = await getLiquidityPools(address);

    if (pools.length === 0) {
      const [solPrice, tokenInfo] = await Promise.all([
        getSolPrice(),
        getTokenInfo(address),
      ]);

      if (solPrice > 0) {
        const sym = tokenInfo?.symbol ?? "???";
        const dec = tokenInfo?.decimals ?? 6;

        const swapPool = await getPumpSwapPool(address, solPrice, dec, sym);
        if (swapPool) {
          pools.push(swapPool);
        } else {
          const bcPool = await getBondingCurvePool(address, solPrice, sym);
          if (bcPool) pools.push(bcPool);
        }
      }
    }

    return Response.json({ pools });
  } catch (error) {
    logError("Failed to fetch liquidity", error, { address });
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to fetch liquidity" },
      { status: 500 },
    );
  }
}
