import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();

  cookieStore.delete("qf_access_token");
  cookieStore.delete("qf_refresh_token");
  cookieStore.delete("qf_logged_in");

  return NextResponse.json({ ok: true });
}
