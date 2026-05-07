import { NextRequest, NextResponse } from "next/server";
import { qfGet, qfPost } from "@/lib/qf-api";

/** GET /api/qf/goals — Get today's goal plan */
export async function GET() {
  try {
    const data = await qfGet("/goals/today");
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch goals" },
      { status: 500 }
    );
  }
}

/** POST /api/qf/goals — Create/update a goal */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await qfPost("/goals", body);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create goal" },
      { status: 500 }
    );
  }
}
