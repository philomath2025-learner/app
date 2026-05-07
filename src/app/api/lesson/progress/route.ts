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

    const word = await request.json();

    // 1. Insert into vocabulary_ledger
    const ledgerEntry = {
      user_id: profile.id,
      root: word.root,
      first_surface_form: word.arabic,
      first_ayah_key: word.ayahKey,
      pos: word.pos,
      meaning_cluster: "default",
      lemma: word.lemma,
      translation_en: word.translation || null,
      frequency_root: word.frequencyRoot || 0,
      srs_interval: 1,
      srs_repetitions: 1,
      srs_ease_factor: 2.5,
      srs_next_review: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    };

    // @ts-ignore - bypassing types for MVP speed
    const { error: ledgerError } = await supabaseAdmin
      .from("vocabulary_ledger")
      .upsert(ledgerEntry, { onConflict: "user_id, root, meaning_cluster" });

    if (ledgerError) {
      console.error("Supabase ledger insert error:", ledgerError);
      throw ledgerError;
    }

    console.log(`Successfully saved root ${word.root} for user ${profile.id}`);

    // 2. Insert into vocabulary_decisions (permanent dedup log)
    // @ts-ignore
    await supabaseAdmin.from("vocabulary_decisions").upsert({
      user_id: profile.id,
      ayah_key: word.ayahKey,
      word_position: word.position,
      arabic: word.arabic,
      root: word.root,
      dedup_level: 0,
      verdict: "new",
      xp_awarded: 10,
    }, { onConflict: "user_id, ayah_key, word_position" });

    // 3. Update User Progress XP (assuming +10 per new root)
    // First fetch current XP
    const { data: progress } = await supabaseAdmin
      .from("user_progress")
      .select("xp, vocabulary_count")
      .eq("user_id", profile.id)
      .single();

    if (progress) {
      // @ts-ignore
      await supabaseAdmin.from("user_progress").update({
        xp: progress.xp + 10,
        vocabulary_count: progress.vocabulary_count + 1,
        last_activity_date: new Date().toISOString()
      }).eq("user_id", profile.id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Progress save error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
