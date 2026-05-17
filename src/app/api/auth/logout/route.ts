import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Clear both tokens
    cookieStore.delete("sb_custom_token");
    cookieStore.delete("qf_logged_in");
    cookieStore.delete("qf_access_token");

    // Clear any PKCE flow cookies just in case
    cookieStore.delete("qf_pkce_verifier");
    cookieStore.delete("qf_state");
    cookieStore.delete("qf_nonce");

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("LOGOUT_ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
