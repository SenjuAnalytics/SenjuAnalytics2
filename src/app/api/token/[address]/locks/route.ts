import { getTokenLocks } from "@/services/token.service";
import { logError } from "@/lib/error-logger";
import type { NextRequest } from "next/server";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ address: string }> }) {
  const { address } = await ctx.params;

  try {
    const locks = await getTokenLocks(address);
    return Response.json({ locks });
  } catch (error) {
    logError("Failed to fetch locks", error, { address });
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to fetch locks" },
      { status: 500 },
    );
  }
}
