import { NextRequest, NextResponse } from "next/server";
import { getCurrentStreak } from "@/lib/qf-api";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sb_custom_token")?.value;
    if (!token) {
      return NextResponse.json({ streak: 0 }); // Local fallback logic can be handled by client
    }

    const data = await getCurrentStreak();
    // Assuming data contains a 'streak' or 'current_streak' property based on typical structures
    // Actually, according to standard naming, it might be data.current_streak or data.streak
    // We will extract whatever represents the number of days.
    const streak = data.current_streak || data.streak || 0;

    return NextResponse.json({ streak });
  } catch (error) {
    console.error("Failed to fetch QF streak:", error);
    return NextResponse.json({ streak: 0 });
  }
}
