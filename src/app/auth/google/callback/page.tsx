"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Client-side callback handler for Google OAuth.
 * We use a client component because supabase-js stores PKCE verifiers in localStorage.
 */
export default function GoogleCallbackPage() {
  useEffect(() => {
    let synced = false;

    async function syncSession(user: any) {
      if (synced) return;
      synced = true;
      try {
        const res = await fetch("/api/auth/sync-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            authId: user.id,
            email: user.email,
            displayName: user.user_metadata?.full_name || "Google Learner",
          }),
        });

        if (res.ok) {
          window.location.href = "/?auth_success=true";
        } else {
          const errData = await res.json();
          window.location.href = "/?auth_error=" + encodeURIComponent(errData.error || "Sync failed");
        }
      } catch (err) {
        console.error("Sync error:", err);
        window.location.href = "/?auth_error=sync_exception";
      }
    }

    // 1. Listen for the auth state change
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
        syncSession(session.user);
      }
    });

    // 2. Also check manually
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        window.location.href = "/?auth_error=" + encodeURIComponent(error.message);
      } else if (data?.session?.user) {
        syncSession(data.session.user);
      }
    });

    // 3. Failsafe timeout: if Supabase fails to extract the session from the URL, abort
    const timeout = setTimeout(() => {
      if (!synced) {
        const hash = window.location.hash;
        if (hash && hash.includes("error_description=")) {
           const errMsg = new URLSearchParams(hash.substring(1)).get("error_description");
           window.location.href = "/?auth_error=" + encodeURIComponent(errMsg || "Unknown Auth Error");
        } else {
           window.location.href = "/?auth_error=timeout_no_session";
        }
      }
    }, 4000);

    return () => {
      authListener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 border-4 border-green border-t-transparent rounded-full animate-spin mb-4"></div>
      <h2 className="text-[18px] font-black text-text">Finishing login...</h2>
      <p className="text-[14px] text-text-light mt-2">Setting up your learning profile</p>
    </div>
  );
}
