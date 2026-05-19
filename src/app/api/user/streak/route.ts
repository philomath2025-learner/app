import { NextRequest, NextResponse } from "next/server";
import { getCurrentStreak } from "@/lib/qf-api";
import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import { supabaseAdmin } from "@/lib/supabase";

/** Helper: read streak from Supabase user_progress table */
async function getLocalStreak(authId: string, userTz: string): Promise<number> {
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

  // Use timezone to correctly calculate "today" and "yesterday"
  const formatter = new Intl.DateTimeFormat('en-CA', { 
    timeZone: userTz, 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  });
  
  const today = formatter.format(new Date());
  const yesterday = formatter.format(new Date(Date.now() - 86400000));

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

    let qfStreak = 0;
    // 1. Try QF API first (only works with real QF OAuth login)
    const qfToken = cookieStore.get("qf_access_token")?.value;
    if (qfToken) {
      try {
        const data = await getCurrentStreak();
        qfStreak = data.current_streak || data.streak || 0;
      } catch (e) {
        console.warn("QF streak API failed:", e);
      }
    }

    // 2. Read streak from Supabase user_progress as a robust fallback/comparator
    if (authId) {
      const userTz = request.headers.get("x-user-timezone") || request.headers.get("x-vercel-ip-timezone") || "UTC";
      const localStreak = await getLocalStreak(authId, userTz);
      // Return the maximum of the two to ensure UI is always immediately responsive
      return NextResponse.json({ streak: Math.max(qfStreak, localStreak) });
    }

    return NextResponse.json({ streak: qfStreak });
  } catch (error) {
    console.error("Failed to fetch streak:", error);
    return NextResponse.json({ streak: 0 });
  }
}
