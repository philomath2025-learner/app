import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("qf_access_token")?.value;
  const loggedIn = cookieStore.get("qf_logged_in")?.value === "true";

  if (!accessToken || !loggedIn) {
    return NextResponse.json({ authenticated: false });
  }

  // Optionally fetch user info from QF
  try {
    const res = await fetch(`${process.env.QF_API_BASE}/users/profile`, {
      headers: {
        "x-auth-token": accessToken,
        "x-client-id": process.env.QF_CLIENT_ID!,
      },
    });

    if (res.ok) {
      const profile = await res.json();
      return NextResponse.json({ authenticated: true, user: profile });
    }
  } catch {
    // Token might be expired — still report authenticated for now
  }

  return NextResponse.json({ authenticated: true, user: null });
}
