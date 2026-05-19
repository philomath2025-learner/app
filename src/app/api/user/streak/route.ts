import { NextRequest, NextResponse } from "next/server";
import { getCurrentStreak } from "@/lib/qf-api";
import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import { supabaseAdmin } from "@/lib/supabase";

/** Helper: read streak from Supabase user_progress table */
async function getLocalStreak(authId: string): Promise<number> {
  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("id")
    .eq("auth_id", authId)
    .single();

  if (!profile) return 0;

  const { data: progress } = await supabaseAdmin
    .from("user_progress")
    .select("streak_days, streak_last_date")
    .eq("user_id", profile.id)
    .single();

  if (!progress) return 0;

  // Validate the streak is still alive (last activity was today or yesterday)
  const lastDate = progress.streak_last_date;
  if (!lastDate) return 0;

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (lastDate === today || lastDate === yesterday) {
    return progress.streak_days || 0;
  }

  // Streak has expired (more than 1 day gap)
  return 0;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sb_custom_token")?.value;
    if (!token) {
      return NextResponse.json({ streak: 0 });
    }

    const payload = decodeJwt(token);
    const authId = payload?.sub as string;

    // 1. Try QF API first (only works with real QF OAuth login)
    const qfToken = cookieStore.get("qf_access_token")?.value;
    if (qfToken) {
      try {
        const data = await getCurrentStreak();
        const streak = data.current_streak || data.streak || 0;
        return NextResponse.json({ streak });
      } catch (e) {
        console.warn("QF streak API failed, falling back to local:", e);
      }
    }

    // 2. Fallback: read streak from Supabase user_progress
    if (authId) {
      const localStreak = await getLocalStreak(authId);
      return NextResponse.json({ streak: localStreak });
    }

    return NextResponse.json({ streak: 0 });
  } catch (error) {
    console.error("Failed to fetch streak:", error);
    return NextResponse.json({ streak: 0 });
  }
}
