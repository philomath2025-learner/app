import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import { supabaseAdmin } from "@/lib/supabase";

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

    const { decisions } = await request.json();

    if (!decisions || !Array.isArray(decisions)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const payloadDecisions = decisions.map((d: any) => {
      // Strip client-only fields that don't exist in the DB schema
      const { rule, ...dbFields } = d;
      return {
        ...dbFields,
        user_id: profile.id,
      };
    });

    // @ts-ignore
    const { error } = await supabaseAdmin.from("vocabulary_decisions").upsert(payloadDecisions, { onConflict: "user_id, ayah_key, word_position" });

    if (error) {
      console.error("Supabase decisions insert error:", error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Decisions save error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
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

    const { data: decisions, error } = await supabaseAdmin
      .from("vocabulary_decisions")
      .select("*")
      .eq("user_id", profile.id)
      .order("decided_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ decisions });
  } catch (error: any) {
    console.error("Decisions fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
