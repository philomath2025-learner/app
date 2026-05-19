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

    const userTz = request.headers.get("x-user-timezone") || request.headers.get("x-vercel-ip-timezone") || "UTC";
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: userTz, year: 'numeric', month: '2-digit', day: '2-digit' });
    
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
      srs_repetitions: 0,
      srs_ease_factor: 2.5,
      srs_next_review: formatter.format(new Date(Date.now() + 86400000)),
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

    // (Removed redundant insert into vocabulary_decisions here because it's handled properly by the batch saveAllDecisions at the end of the Ayah)



    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Progress save error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
