import { NextRequest, NextResponse } from "next/server";
import { qfPost } from "@/lib/qf-api";

/** POST /api/qf/activity-days — Log a learning activity day */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await qfPost("/activity-days", body);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to log activity" },
      { status: 500 }
    );
  }
}
