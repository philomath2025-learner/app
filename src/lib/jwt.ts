import { SignJWT, decodeJwt } from "jose";

/**
 * Decode an ID token from QF to get the 'sub' (User ID) and profile data.
 */
export function decodeQfToken(idToken: string) {
  try {
    const payload = decodeJwt(idToken);
    return payload; // contains 'sub', 'email', 'name', etc.
  } catch (error) {
    console.error("Failed to decode QF ID token:", error);
    return null;
  }
}

/**
 * Sign a Custom JWT that Supabase will accept.
 * This effectively logs the user into Supabase bypassing email/password.
 */
export async function signSupabaseToken(sub: string) {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error("Missing SUPABASE_JWT_SECRET environment variable.");
  }

  // Create the payload exactly as Supabase expects for an authenticated user
  const payload = {
    aud: "authenticated",
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 1 week
    sub: sub,
    role: "authenticated",
  };

  const secretKey = new TextEncoder().encode(secret);

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .sign(secretKey);

  return token;
}
