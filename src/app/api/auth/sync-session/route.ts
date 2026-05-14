import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signSupabaseToken } from "@/lib/jwt";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * API route to sync a Supabase Auth session (like Google)
 * with our custom cookie-based flow (sb_custom_token).
 */
export async function POST(request: NextRequest) {
  try {
    const { authId, displayName } = await request.json();

    if (!authId) {
      return NextResponse.json({ error: "Missing authId" }, { status: 400 });
    }

    // 1. Sync to user_profiles table using supabaseAdmin (bypasses RLS)
    const { data: existingProfile } = await supabaseAdmin
      .from("user_profiles")
      .select("id")
      .eq("auth_id", authId)
      .single();

    if (!existingProfile) {
      // Create new profile
      // @ts-ignore
      const { data: newProfile, error: profileErr } = await supabaseAdmin.from("user_profiles").insert({
        auth_id: authId,
        display_name: displayName || "Google Learner",
        display_initial: (displayName || "G").charAt(0).toUpperCase(),
      }).select().single();

      if (profileErr) throw new Error(`Profile creation failed: ${profileErr.message}`);

      // Create matching progress row
      if (newProfile) {
        // @ts-ignore
        await supabaseAdmin.from("user_progress").insert({ user_id: newProfile.id });
      }
    }

    // 2. Generate Custom Supabase Token for RLS (matching our QF logic)
    const customToken = await signSupabaseToken(authId);

    // 3. Set cookies
    const cookieStore = await cookies();
    
    cookieStore.set("sb_custom_token", customToken, {
      httpOnly: false, // Must be false so client supabase-js can read it in supabase.ts
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    cookieStore.set("qf_logged_in", "true", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("SYNC_SESSION_ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
