import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import { supabaseAdmin } from "@/lib/supabase";
import { calculateSM2, ReviewRating, addDays } from "@/lib/srs";

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
    const { root, rating } = body;

    if (!root || !rating) {
      return NextResponse.json({ error: "Missing root or rating" }, { status: 400 });
    }

    // Fetch the current ledger entry
    // @ts-ignore — Supabase types not generated
    const { data: entry, error: fetchError } = await supabaseAdmin
      .from("vocabulary_ledger")
      .select("*")
      .eq("user_id", profile.id)
      .eq("root", root)
      .eq("meaning_cluster", "default")
      .single();

    if (fetchError || !entry) {
      return NextResponse.json({ error: "Ledger entry not found" }, { status: 404 });
    }

    const typedEntry = entry as any;

    // Calculate new SM-2 values
    const sm2Result = calculateSM2(
      rating as ReviewRating,
      typedEntry.srs_interval,
      typedEntry.srs_repetitions,
      typedEntry.srs_ease_factor
    );

    const nextReviewDate = addDays(new Date(), sm2Result.interval).toISOString().split('T')[0];

    // Update ledger
    // @ts-ignore
    const { error: updateError } = await supabaseAdmin
      .from("vocabulary_ledger")
      .update({
        srs_interval: sm2Result.interval,
        srs_repetitions: sm2Result.repetition,
        srs_ease_factor: sm2Result.easeFactor,
        srs_next_review: nextReviewDate,
        srs_last_review: new Date().toISOString(),
      })
      .eq("id", typedEntry.id);

    if (updateError) throw updateError;

    // @ts-ignore
    const { data: progress } = await supabaseAdmin
      .from("user_progress")
      .select("xp")
      .eq("user_id", profile.id)
      .single();

    if (progress) {
      const xpReward = rating === "again" ? 0 : 5;
      if (xpReward > 0) {
        // @ts-ignore
        await supabaseAdmin.from("user_progress").update({ xp: (progress as any).xp + xpReward }).eq("user_id", profile.id);
      }
    }

    // Log the review to srs_reviews for history/analytics
    // @ts-ignore
    const { error: insertError } = await supabaseAdmin.from("srs_reviews").insert({
      user_id: profile.id,
      ledger_id: typedEntry.id,
      rating: rating,
      prev_interval: typedEntry.srs_interval,
      new_interval: sm2Result.interval,
      prev_ease: typedEntry.srs_ease_factor,
      new_ease: sm2Result.easeFactor,
      xp_awarded: rating === "again" ? 0 : 5,
      reviewed_at: new Date().toISOString()
    });

    if (insertError) {
      console.error("Failed to insert into srs_reviews:", insertError);
    }

    return NextResponse.json({ success: true, sm2Result });
  } catch (error: any) {
    console.error("Review rate error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
