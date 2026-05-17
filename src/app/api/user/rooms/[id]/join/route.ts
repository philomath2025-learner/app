import { NextResponse } from "next/server";
import { joinRoom } from "@/lib/qf-api";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let roomId = "unknown";
  try {
    const { id } = await params;
    roomId = id;
    const data = await joinRoom(id);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Failed to join room ${roomId}:`, error);
    return NextResponse.json({ error: "Failed to join room" }, { status: 500 });
  }
}
