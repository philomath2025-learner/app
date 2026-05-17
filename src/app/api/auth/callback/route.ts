import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeForTokens } from "@/lib/auth";
import { decodeQfToken, signSupabaseToken } from "@/lib/jwt";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");
  const error = searchParams.get("error");
  const appUrl = request.nextUrl.origin;

  if (error) {
    return NextResponse.redirect(`${appUrl}/?auth_error=${encodeURIComponent(error)}`);
  }

  if (!code || !returnedState) {
    return NextResponse.redirect(`${appUrl}/?auth_error=missing_params`);
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("qf_state")?.value;
  if (!savedState || savedState !== returnedState) {
    return NextResponse.redirect(`${appUrl}/?auth_error=state_mismatch`);
  }

  const verifier = cookieStore.get("qf_pkce_verifier")?.value;
  if (!verifier) {
    return NextResponse.redirect(`${appUrl}/?auth_error=missing_verifier`);
  }

  try {
    const tokens = await exchangeCodeForTokens({
      code,
      codeVerifier: verifier,
      redirectUri: `${appUrl}/api/auth/callback`,
      clientId: process.env.QF_CLIENT_ID!,
      clientSecret: process.env.QF_CLIENT_SECRET!,
      oauthEndpoint: process.env.QF_OAUTH_ENDPOINT!,
    });

    cookieStore.delete("qf_pkce_verifier");
    cookieStore.delete("qf_state");
    cookieStore.delete("qf_nonce");

    // 1. Decode QF ID Token
    if (!tokens.id_token) {
      throw new Error("No id_token received from QF");
    }
    const qfProfile = decodeQfToken(tokens.id_token);
    const qfSub = qfProfile?.sub;
    if (!qfSub) throw new Error("No sub found in QF id_token");

    // Try multiple possible fields for name
    const rawName = (qfProfile as any).name || (qfProfile as any).first_name || (qfProfile as any).preferred_username || (qfProfile as any).email?.split("@")[0] || "Learner";
    const displayName = typeof rawName === "string" ? rawName.trim() : "Learner";
    const displayInitial = (displayName || "L").charAt(0).toUpperCase();

    // 2. Sync to Supabase Database using supabaseAdmin
    // Check if user profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from("user_profiles")
      .select("id")
      .eq("auth_id", qfSub)
      .single();

    if (!existingProfile) {
      // Create new profile
      // @ts-ignore
      const { data: newProfile, error: profileErr } = await supabaseAdmin.from("user_profiles").insert({
        auth_id: qfSub,
        display_name: displayName,
        display_initial: displayInitial,
        qf_access_token: tokens.access_token,
        qf_refresh_token: tokens.refresh_token,
        qf_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      }).select().single();

      if (profileErr) throw new Error(`Profile creation failed: ${profileErr.message}`);

      // Create matching progress row
      if (newProfile) {
        // @ts-ignore
        await supabaseAdmin.from("user_progress").insert({ user_id: newProfile.id });
      }
    } else {
      // Update tokens and name for existing user
      // @ts-ignore
      await supabaseAdmin.from("user_profiles").update({
        display_name: displayName,
        display_initial: displayInitial,
        qf_access_token: tokens.access_token,
        qf_refresh_token: tokens.refresh_token,
        qf_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      }).eq("auth_id", qfSub);
    }

    // 3. Generate Custom Supabase Token for RLS
    const customToken = await signSupabaseToken(qfSub);

    // 4. Store custom token in cookie (accessible to client JS)
    cookieStore.set("sb_custom_token", customToken, {
      httpOnly: false, // Must be false so client supabase-js can read it
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

    return NextResponse.redirect(`${appUrl}/?auth_success=true`);
  } catch (err: any) {
    console.error("AUTH_CALLBACK_ERROR_DETAILS:", {
      message: err.message,
      stack: err.stack,
      env: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasJwtSecret: !!process.env.SUPABASE_JWT_SECRET,
        hasQfId: !!process.env.QF_CLIENT_ID,
        appUrl
      }
    });
    return NextResponse.redirect(`${appUrl}/?auth_error=token_exchange_failed&details=${encodeURIComponent(err.message)}`);
  }
}
