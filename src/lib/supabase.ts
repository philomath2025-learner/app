/**
 * Supabase Client — Browser + Server instances
 *
 * - supabase        → client-side (anon key, respects RLS)
 * - supabaseAdmin   → server-side only (service_role key, bypasses RLS)
 *
 * Import supabase in client components, supabaseAdmin in API routes only.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// ── Client-side (anon key — RLS enforced) ──

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    global: {
      headers: {
        ...(typeof document !== "undefined" && getCookie("sb_custom_token")
          ? { Authorization: `Bearer ${getCookie("sb_custom_token")}` }
          : {}),
      },
    },
  }
);

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const v = document.cookie.match("(^|;) ?" + name + "=([^;]*)(;|$)");
  return v ? v[2] : null;
}

// ── Server-side (service_role — bypasses RLS) ──
// ONLY use in API routes / server components. Never expose to client.
// Note: No Database generic — our schema types are stubs, so we use
// an untyped client to avoid `never` errors on every query.

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
