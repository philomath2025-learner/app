import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import { supabaseAdmin } from "@/lib/supabase";

const DEFAULT_PROGRESS = { completedSurahs: [], currentSurahId: 1, surahAyahMap: {} };

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sb_custom_token")?.value;
    if (!token) return NextResponse.json(DEFAULT_PROGRESS);

    const payload = decodeJwt(token);
    const authId = payload?.sub;
    if (!authId) return NextResponse.json(DEFAULT_PROGRESS);

    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("id")
      .eq("auth_id", authId)
      .single();

    if (!profile) return NextResponse.json(DEFAULT_PROGRESS);

    const { data: progress } = await supabaseAdmin
      .from("user_progress")
      .select("surah_progress")
      .eq("user_id", profile.id)
      .single();

    if (!progress || !progress.surah_progress) {
      return NextResponse.json(DEFAULT_PROGRESS);
    }

    return NextResponse.json(progress.surah_progress);
  } catch (error: any) {
    console.error("Surah progress GET error:", error);
    return NextResponse.json(DEFAULT_PROGRESS);
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

    await supabaseAdmin
      .from("user_progress")
      .update({ surah_progress: body })
      .eq("user_id", profile.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Surah progress POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
