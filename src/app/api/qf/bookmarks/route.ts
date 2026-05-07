import { NextRequest, NextResponse } from "next/server";
import { qfGet, qfPost } from "@/lib/qf-api";

/** GET /api/qf/bookmarks — List user bookmarks */
export async function GET() {
  try {
    const data = await qfGet("/bookmarks");
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch bookmarks" },
      { status: 500 }
    );
  }
}

/** POST /api/qf/bookmarks — Add a bookmark */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await qfPost("/bookmarks", body);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to add bookmark" },
      { status: 500 }
    );
  }
}
