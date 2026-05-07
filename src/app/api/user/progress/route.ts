import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import { supabaseAdmin } from "@/lib/supabase";

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
      .select("xp, current_ayah")
      .eq("user_id", profile.id)
      .single();

    if (!progress) return NextResponse.json({ xp: 0, currentAyah: "1:1" });

    return NextResponse.json({ xp: progress.xp, currentAyah: progress.current_ayah });
  } catch (error) {
    console.error("User progress fetch error:", error);
    return NextResponse.json({ xp: 0, currentAyah: "1:1" }, { status: 500 });
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
    const { currentAyah } = body;

    if (currentAyah) {
      await supabaseAdmin
        .from("user_progress")
        .update({ current_ayah: currentAyah })
        .eq("user_id", profile.id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("User progress update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
