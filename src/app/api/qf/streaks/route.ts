import { NextResponse } from "next/server";
import { qfGet } from "@/lib/qf-api";

/** GET /api/qf/streaks — Proxy to QF Streak API */
export async function GET() {
  try {
    const data = await qfGet("/streaks");
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch streaks" },
      { status: 500 }
    );
  }
}
