import { NextResponse } from "next/server";
import { searchRooms } from "@/lib/qf-api";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const roomType = searchParams.get("roomType") || "GROUP";

    const data = await searchRooms(query, page, limit, roomType);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to search rooms:", error);
    return NextResponse.json({ error: "Failed to search rooms" }, { status: 500 });
  }
}
