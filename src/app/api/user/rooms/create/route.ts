import { NextResponse } from "next/server";
import { createRoom } from "@/lib/qf-api";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, isPublic } = body;
    
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const data = await createRoom(name, description, isPublic);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Failed to create room:", error);
    return NextResponse.json({ error: error.message || "Failed to create room" }, { status: 500 });
  }
}
