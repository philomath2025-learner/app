import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import { supabaseAdmin } from "@/lib/supabase";
import { syncActivityDay } from "@/lib/qf-api";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sb_custom_token")?.value;
    if (!token) return NextResponse.json({ xp: 0, currentAyah: "1:1" }, { status: 401 });

    const payload = decodeJwt(token);
    const authId = payload?.sub;

    if (!authId) return NextResponse.json({ xp: 0, currentAyah: "1:1" }, { status: 401 });

    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("id")
      .eq("auth_id", authId)
      .single();

    if (!profile) return NextResponse.json({ xp: 0, currentAyah: "1:1" }, { status: 401 });

    const { data: progress } = await supabaseAdmin
      .from("user_progress")
      .select("xp, current_ayah, hearts, hearts_refill_at, streak_days, streak_last_date")
      .eq("user_id", profile.id)
      .single();

    if (!progress) return NextResponse.json({ xp: 0, currentAyah: "1:1", hearts: 5, streak_days: 0 });

    return NextResponse.json({ 
      xp: progress.xp, 
      currentAyah: progress.current_ayah,
      hearts: progress.hearts,
      hearts_refill_at: progress.hearts_refill_at,
      streak_days: progress.streak_days || 0,
      streak_last_date: progress.streak_last_date,
    });
  } catch (error) {
    console.error("User progress fetch error:", error);
    return NextResponse.json({ xp: 0, currentAyah: "1:1", hearts: 5 }, { status: 500 });
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
    const { currentAyah, hearts, hearts_refill_at, xpToAdd } = body;

    const updateData: any = {};
    if (currentAyah) updateData.current_ayah = currentAyah;
    if (hearts !== undefined) updateData.hearts = hearts;
    if (hearts_refill_at) updateData.hearts_refill_at = hearts_refill_at;

    if (xpToAdd) {
      const { data: progress } = await supabaseAdmin
        .from("user_progress")
        .select("xp, total_words_learned, streak_days, streak_last_date")
        .eq("user_id", profile.id)
        .single();
        
      if (progress) {
        updateData.xp = progress.xp + xpToAdd;
        // Optionally bump vocab count if this was a new word (we assume 10 XP = new word for now)
        if (xpToAdd === 10) {
           updateData.total_words_learned = (progress.total_words_learned || 0) + 1;
        }

        // ── Streak logic ──
        const userTz = request.headers.get("x-user-timezone") || request.headers.get("x-vercel-ip-timezone") || "UTC";
        const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: userTz, year: 'numeric', month: '2-digit', day: '2-digit' });
        const today = formatter.format(new Date());
        const lastDate = progress.streak_last_date;

        if (lastDate === today) {
          // Already active today — no change needed
        } else {
          const yesterday = formatter.format(new Date(Date.now() - 86400000));
          if (lastDate === yesterday) {
            // Consecutive day — extend streak
            updateData.streak_days = (progress.streak_days || 0) + 1;
          } else {
            // Gap > 1 day or first ever activity — reset to 1
            updateData.streak_days = 1;
          }
          updateData.streak_last_date = today;
        }

        // Inform QF of the activity so official streak aligns
        try {
          await syncActivityDay(120, today);
        } catch (e) {
          console.error("Failed to sync activity to QF during XP update:", e);
        }
      }
    }

    if (Object.keys(updateData).length > 0) {
      await supabaseAdmin
        .from("user_progress")
        .update(updateData)
        .eq("user_id", profile.id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("User progress update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
