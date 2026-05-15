import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sb_custom_token")?.value;
    if (!token) return NextResponse.json({ history: [] }, { status: 401 });

    const payload = decodeJwt(token);
    const authId = payload?.sub;
    if (!authId) return NextResponse.json({ history: [] }, { status: 401 });

    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("id")
      .eq("auth_id", authId)
      .single();

    if (!profile) return NextResponse.json({ history: [] }, { status: 404 });

    const daysStr = request.nextUrl.searchParams.get("days") || "7";
    const days = parseInt(daysStr, 10) || 7;

    // Calculate start date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    const startDateStr = startDate.toISOString().split('T')[0];

    const { data: goals, error } = await supabaseAdmin
      .from("daily_goals")
      .select("goal_date, xp_earned")
      .eq("user_id", profile.id)
      .gte("goal_date", startDateStr);

    if (error) throw error;

    // Build continuous history array
    const history: { date: string; xp_earned: number }[] = [];
    const goalsMap = new Map((goals || []).map(g => [g.goal_date, g.xp_earned]));

    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      history.push({
        date: dateStr,
        xp_earned: goalsMap.get(dateStr) || 0,
      });
    }

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Activity fetch error:", error);
    return NextResponse.json({ history: [] }, { status: 500 });
  }
}
