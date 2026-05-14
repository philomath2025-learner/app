"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Client-side callback handler for Google OAuth.
 * We use a client component because supabase-js stores PKCE verifiers in localStorage.
 */
export default function GoogleCallbackPage() {
  useEffect(() => {
    async function handleAuth() {
      // 1. Let Supabase client handle the code/session exchange
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Auth error:", error);
        window.location.href = "/?auth_error=" + encodeURIComponent(error.message);
        return;
      }

      if (data?.session?.user) {
        const user = data.session.user;
        
        // 2. Sync this session to our custom cookie-based flow
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
      } else {
        // No session found yet, maybe still loading?
        // But getSession is async and should return if hash/code is present.
        console.warn("No session found in callback");
      }
    }

    handleAuth();
  }, []);

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 border-4 border-green border-t-transparent rounded-full animate-spin mb-4"></div>
      <h2 className="text-[18px] font-black text-text">Finishing login...</h2>
      <p className="text-[14px] text-text-light mt-2">Setting up your learning profile</p>
    </div>
  );
}
