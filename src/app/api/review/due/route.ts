import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import { supabaseAdmin } from "@/lib/supabase";
import { fetchVerseByKey } from "@/lib/quran-api";
import { getDefaultTranslationId } from "@/lib/qf-languages";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sb_custom_token")?.value;
    if (!token) return NextResponse.json({ cards: [] }, { status: 401 });

    const payload = decodeJwt(token);
    const authId = payload?.sub;

    if (!authId) return NextResponse.json({ cards: [] }, { status: 401 });

    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("id")
      .eq("auth_id", authId)
      .single();

    if (!profile) return NextResponse.json({ cards: [] }, { status: 401 });

    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20", 10);
    const today = new Date().toISOString().split('T')[0];

    // Fetch words due for review today or earlier
    // @ts-ignore — Supabase types not generated
    const { data: dueCards, error } = await supabaseAdmin
      .from("vocabulary_ledger")
      .select("*")
      .eq("user_id", profile.id)
      .lte("srs_next_review", today)
      .limit(limit);

    if (error) throw error;

    let cardsToReview: any[] = dueCards || [];

    if (cardsToReview.length === 0) {
      return NextResponse.json({ cards: [] });
    }

    // Map to ReviewCard structure with full ayah context
    const cards = await Promise.all(
      cardsToReview.map(async (entry) => {
        let ayahText = "";
        let ayahTranslation = "";
        let ayahWords: { arabic: string; translation: string }[] = [];

        try {
          const translationId = await getDefaultTranslationId("en");
          const verse = await fetchVerseByKey(entry.first_ayah_key, { language: "en", translationId });
          
          // Build word-by-word data (only actual words, not end markers)
          const actualWords = verse.words.filter((w: any) => w.char_type_name === "word");
          ayahWords = actualWords.map((w: any) => ({
            arabic: w.text_uthmani,
            translation: w.translation?.text || "",
          }));
          ayahText = actualWords.map((w: any) => w.text_uthmani).join(" ");
          
          // Get the full ayah translation
          if (verse.translations && verse.translations.length > 0) {
            // Strip HTML tags from translation text
            ayahTranslation = verse.translations[0].text.replace(/<[^>]*>/g, "");
          }
        } catch (e) {
          console.error("Failed to fetch ayah context for review card", e);
        }

        return {
          id: entry.root || entry.id,
          arabic: entry.first_surface_form,
          root: entry.root || entry.lemma,
          meaning: entry.translation_en || "Translation unavailable",
          ayah: ayahText,
          ayahTranslation,
          ayahWords,
          ref: entry.first_ayah_key,
          hint: entry.pos,
          xp: 10,
          srs_interval: entry.srs_interval,
          srs_repetitions: entry.srs_repetitions,
          srs_ease_factor: entry.srs_ease_factor,
        };
      })
    );

    return NextResponse.json({ cards });
  } catch (error: any) {
    console.error("Review due fetch error:", error);
    return NextResponse.json({ cards: [] }, { status: 500 });
  }
}
