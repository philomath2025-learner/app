import { NextRequest, NextResponse } from "next/server";

/**
 * GET/POST /api/user/preferences
 *
 * Until Supabase is wired, preferences are managed client-side (localStorage).
 * This endpoint is a placeholder that:
 *   - GET: returns defaults
 *   - POST: acknowledges save
 *
 * When Supabase is ready, this will read/write to the `user_preferences` table.
 */

const DEFAULTS = {
  lang: "en",
  reviewLimit: 20,
  newWordsLimit: 10,
  dailyGoal: 5,
  audioAutoplay: false,
};

export async function GET() {
  return NextResponse.json({ preferences: DEFAULTS, source: "defaults" });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const allowed = Object.keys(DEFAULTS);
    const prefs: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) prefs[key] = body[key];
    }

    // TODO: When Supabase is connected, save to user_preferences table
    // const { error } = await supabase.from('user_preferences').upsert({ user_id, ...prefs });

    return NextResponse.json({ ok: true, saved: prefs, source: "pending-supabase" });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
