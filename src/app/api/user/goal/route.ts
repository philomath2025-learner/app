import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sb_custom_token")?.value;
    if (!token) return NextResponse.json({ xp_earned: 0, completed: false }, { status: 401 });

    const payload = decodeJwt(token);
    const authId = payload?.sub;
    if (!authId) return NextResponse.json({ xp_earned: 0, completed: false }, { status: 401 });

    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("id")
      .eq("auth_id", authId)
      .single();

    if (!profile) return NextResponse.json({ xp_earned: 0, completed: false }, { status: 401 });

    const today = new Date().toISOString().split('T')[0];

    const { data: goal } = await supabaseAdmin
      .from("daily_goals")
      .select("xp_earned, completed")
      .eq("user_id", profile.id)
      .eq("goal_date", today)
      .single();

    if (!goal) return NextResponse.json({ xp_earned: 0, completed: false });

    return NextResponse.json({ xp_earned: goal.xp_earned, completed: goal.completed });
  } catch (error) {
    console.error("Daily goal fetch error:", error);
    return NextResponse.json({ xp_earned: 0, completed: false }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sb_custom_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = decodeJwt(token);
    const authId = payload?.sub;
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("id")
      .eq("auth_id", authId)
      .single();

    if (!profile) return NextResponse.json({ error: "Unauthorized profile" }, { status: 401 });

    const body = await request.json();
    const { xp_earned, completed } = body;
    const today = new Date().toISOString().split('T')[0];

    // Upsert daily goal
    const { error } = await supabaseAdmin
      .from("daily_goals")
      .upsert({ 
        user_id: profile.id, 
        goal_date: today, 
        xp_earned: xp_earned, 
        completed: !!completed 
      }, { onConflict: 'user_id, goal_date' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Daily goal update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
