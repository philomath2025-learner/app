import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import { supabaseAdmin } from "@/lib/supabase";

const DEFAULTS = {
  lang: "en",
  reviewLimit: 20,
  newWordsLimit: 10,
  translationId: 131,
  tafsirId: 169,
};

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sb_custom_token")?.value;
    if (!token) return NextResponse.json({ preferences: DEFAULTS, source: "defaults" });

    const payload = decodeJwt(token);
    const authId = payload?.sub;
    if (!authId) return NextResponse.json({ preferences: DEFAULTS, source: "defaults" });

    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("language, preferred_translation_id, preferred_tafsir_id, review_limit, new_words_limit")
      .eq("auth_id", authId)
      .single();

    if (!profile) return NextResponse.json({ preferences: DEFAULTS, source: "defaults" });

    return NextResponse.json({
      preferences: {
        lang: profile.language || DEFAULTS.lang,
        translationId: profile.preferred_translation_id || DEFAULTS.translationId,
        tafsirId: profile.preferred_tafsir_id || DEFAULTS.tafsirId,
        reviewLimit: profile.review_limit || DEFAULTS.reviewLimit,
        newWordsLimit: profile.new_words_limit || DEFAULTS.newWordsLimit,
      },
      source: "cloud"
    });
  } catch (error) {
    console.error("Preferences GET error:", error);
    return NextResponse.json({ preferences: DEFAULTS, source: "error" });
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

    const body = await request.json();

    const updates: Record<string, any> = {};
    if (body.lang !== undefined) updates.language = body.lang;
    if (body.translationId !== undefined) updates.preferred_translation_id = body.translationId;
    if (body.tafsirId !== undefined) updates.preferred_tafsir_id = body.tafsirId;
    if (body.reviewLimit !== undefined) updates.review_limit = body.reviewLimit;
    if (body.newWordsLimit !== undefined) updates.new_words_limit = body.newWordsLimit;

    if (Object.keys(updates).length > 0) {
      const { error } = await supabaseAdmin
        .from("user_profiles")
        .update(updates)
        .eq("auth_id", authId);

      if (error) {
         console.error("Failed to update preferences:", error);
         return NextResponse.json({ error: "Database error" }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, saved: updates, source: "supabase" });
  } catch (error) {
    console.error("Preferences POST error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
