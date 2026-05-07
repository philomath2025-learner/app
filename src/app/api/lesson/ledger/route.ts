import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sb_custom_token")?.value;
    if (!token) return NextResponse.json({ ledger: [] }, { status: 401 });

    const payload = decodeJwt(token);
    const authId = payload?.sub;

    if (!authId) return NextResponse.json({ ledger: [] }, { status: 401 });
    
    // Fetch the actual user profile ID using authId
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("id")
      .eq("auth_id", authId)
      .single();

    if (!profile) return NextResponse.json({ ledger: [] }, { status: 401 });

    // Fetch user's known vocabulary
    const { data, error } = await supabaseAdmin
      .from("vocabulary_ledger")
      .select("*")
      .eq("user_id", profile.id);

    if (error) {
      console.error("Supabase ledger fetch error:", error);
      throw error;
    }

    console.log(`Fetched ${data?.length || 0} ledger entries for user ${profile.id}`);

    return NextResponse.json({ ledger: data || [] });
  } catch (error) {
    console.error("Ledger fetch error:", error);
    return NextResponse.json({ ledger: [] }, { status: 500 });
  }
}
