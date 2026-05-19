import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sb_custom_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = decodeJwt(token);
    const authId = payload?.sub;

    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch the actual user profile ID using authId
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("id")
      .eq("auth_id", authId)
      .single();

    if (!profile) return NextResponse.json({ error: "Unauthorized profile" }, { status: 401 });

    console.log("Resetting all progress for user:", profile.id);

    // 1. Delete all vocabulary_ledger entries
    await supabaseAdmin
      .from("vocabulary_ledger")
      .delete()
      .eq("user_id", profile.id);

    // 2. Delete all vocabulary_decisions entries
    await supabaseAdmin
      .from("vocabulary_decisions")
      .delete()
      .eq("user_id", profile.id);

    // 3. Delete all daily_goals entries
    await supabaseAdmin
      .from("daily_goals")
      .delete()
      .eq("user_id", profile.id);

    // 4. Reset user_progress XP and counts
    await supabaseAdmin
      .from("user_progress")
      .update({
        xp: 0,
        total_words_learned: 0,
        total_roots_learned: 0,
        total_reviews: 0,
        current_ayah: "1:1",
        current_juz: 1,
        surah_progress: { completedSurahs: [], currentSurahId: 1, surahAyahMap: {} },
      })
      .eq("user_id", profile.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Progress reset error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
