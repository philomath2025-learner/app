import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generatePKCE, generateRandom, buildAuthUrl } from "@/lib/auth";

export async function GET() {
  const clientId = process.env.QF_CLIENT_ID!;
  const oauthEndpoint = process.env.QF_OAUTH_ENDPOINT!;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = appUrl;
  const scopes = "openid offline_access user streak goal bookmark reading_session preference";

  // Generate PKCE
  const { verifier, challenge } = generatePKCE();
  const state = generateRandom();
  const nonce = generateRandom();

  // Store PKCE verifier + state + nonce in httpOnly cookie (short-lived)
  const cookieStore = await cookies();
  cookieStore.set("qf_pkce_verifier", verifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 min
    path: "/",
  });
  cookieStore.set("qf_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  cookieStore.set("qf_nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  // Build authorization URL
  const authUrl = buildAuthUrl({
    clientId,
    redirectUri,
    codeChallenge: challenge,
    state,
    nonce,
    scopes,
    oauthEndpoint,
  });

  return NextResponse.redirect(authUrl);
}
