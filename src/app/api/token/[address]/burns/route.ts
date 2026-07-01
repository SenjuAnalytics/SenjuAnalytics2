import { getBurnRecords } from "@/services/token.service";
import { logError } from "@/lib/error-logger";
import type { NextRequest } from "next/server";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ address: string }> }) {
  const { address } = await ctx.params;

  try {
    const burns = await getBurnRecords(address);
    return Response.json({ burns });
  } catch (error) {
    logError("Failed to fetch burn records", error, { address });
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to fetch burn records" },
      { status: 500 },
    );
  }
}
