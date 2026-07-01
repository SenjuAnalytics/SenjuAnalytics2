import { getTokenTransactions } from "@/services/token.service";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest, ctx: { params: Promise<{ address: string }> }) {
  const { address } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") || "50");

  try {
    const transactions = await getTokenTransactions(address, Math.min(limit, 100));
    return Response.json({ transactions });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to fetch transactions" },
      { status: 500 },
    );
  }
}
