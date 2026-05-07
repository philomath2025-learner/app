import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signSupabaseToken } from "@/lib/jwt";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  // Use a stable, fake UUID for local testing
  const mockSub = "00000000-0000-0000-0000-000000000000";
  const mockName = "Dev Learner";

  try {
    const cookieStore = await cookies();

    // 1. Upsert mock user into Supabase
    const { data: existingProfile } = await supabaseAdmin
      .from("user_profiles")
      .select("id")
      .eq("auth_id", mockSub)
      .single();

    if (!existingProfile) {
      // @ts-ignore
      const { data: newProfile, error: profileErr } = await supabaseAdmin.from("user_profiles").insert({ auth_id: mockSub, display_name: mockName, display_initial: "D" }).select().single();

      if (profileErr) throw new Error(`Mock profile creation failed: ${profileErr.message}`);

      if (newProfile) {
        // @ts-ignore
        await supabaseAdmin.from("user_progress").insert({ user_id: newProfile.id });
      }
    }

    // 2. Generate Custom Supabase Token
    const customToken = await signSupabaseToken(mockSub);

    // 3. Store tokens in cookies
    cookieStore.set("sb_custom_token", customToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    cookieStore.set("qf_logged_in", "true", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.redirect(`${appUrl}/?auth_success=true`);
  } catch (err) {
    console.error("Mock login error:", err);
    return NextResponse.redirect(`${appUrl}/?auth_error=mock_login_failed`);
  }
}
