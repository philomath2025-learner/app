import { NextRequest, NextResponse } from "next/server";
import { getJoinedRooms } from "@/lib/qf-api";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sb_custom_token")?.value;
    if (!token) return NextResponse.json({ rooms: [] }, { status: 401 });

    const roomsData = await getJoinedRooms();
    // Assuming roomsData has an array under some key or is an array
    const rooms = Array.isArray(roomsData) ? roomsData : roomsData.rooms || roomsData.data || [];

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error("Failed to fetch QF rooms:", error);
    return NextResponse.json({ rooms: [] }, { status: 500 });
  }
}
