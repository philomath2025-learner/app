import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sb_custom_token")?.value;
    if (!token) return NextResponse.json({ display_initial: "A" }, { status: 401 });

    const payload = decodeJwt(token);
    const authId = payload?.sub;

    if (!authId) return NextResponse.json({ display_initial: "A" }, { status: 401 });

    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("id, display_name, display_initial, created_at")
      .eq("auth_id", authId)
      .single();

    if (!profile) return NextResponse.json({ display_initial: "A" }, { status: 404 });

    const { data: progress } = await supabaseAdmin
      .from("user_progress")
      .select("total_roots_learned, level_name")
      .eq("user_id", profile.id)
      .single();

    return NextResponse.json({ 
      display_name: profile.display_name,
      display_initial: profile.display_initial,
      created_at: profile.created_at,
      total_roots_learned: progress?.total_roots_learned || 0,
      level_name: progress?.level_name || "Mubtadi"
    });
  } catch (error) {
    console.error("User profile fetch error:", error);
    return NextResponse.json({ display_initial: "A" }, { status: 500 });
  }
}
