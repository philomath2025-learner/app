import { NextRequest, NextResponse } from "next/server";
import { getRoomMembers } from "@/lib/qf-api";
import { cookies } from "next/headers";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("sb_custom_token")?.value;
    if (!token) return NextResponse.json({ members: [] }, { status: 401 });

    const membersData = await getRoomMembers(id);
    const members = Array.isArray(membersData) ? membersData : membersData.members || membersData.data || [];

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Failed to fetch QF room members:", error);
    return NextResponse.json({ members: [] }, { status: 500 });
  }
}
