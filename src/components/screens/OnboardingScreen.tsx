"use client";

interface OnboardingScreenProps {
  onLogin: () => void;
  onGuest: () => void;
}

export default function OnboardingScreen({ onLogin, onGuest }: OnboardingScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      {/* Mascot/Logo area */}
      <div className="w-32 h-32 mb-8 animate-float">
        <img src="/logo.png" alt="QuranLingo Logo" className="w-full h-full object-contain" />
      </div>

      <h1 className="text-[28px] font-black text-text mb-3 leading-tight">
        Learn Quranic Arabic
        <br />
        <span className="text-green">Root by Root</span>
      </h1>

      <p className="text-[15px] text-text-light mb-10 max-w-[280px]">
        Master the vocabulary of the Quran using spaced repetition and a unified root-based system.
      </p>

      {/* Primary Action */}
      <button
        onClick={onLogin}
        className="w-full max-w-[280px] bg-green hover:bg-[#46A302] text-white rounded-[16px] py-4 px-6 text-[16px] font-black uppercase tracking-wide border-b-4 border-[#3D8F02] active:border-b-0 active:translate-y-[4px] transition-all shadow-[0_4px_0_#3D8F02] mb-4"
      >
        Login with Quran Foundation
      </button>

      {/* Google Testing Action */}
      <button
        onClick={async () => {
          const { supabase } = await import("@/lib/supabase");
          await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: `${window.location.origin}/auth/google/callback`,
            },
          });
        }}
        className="w-full max-w-[280px] bg-white hover:bg-gray-50 text-text rounded-[16px] py-4 px-6 text-[16px] font-black uppercase tracking-wide border-b-4 border-gray-300 active:border-b-0 active:translate-y-[4px] transition-all shadow-[0_4px_0_#d1d5db] mb-4 flex items-center justify-center gap-3"
      >
        <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
        Login with Google
      </button>

      {/* Guest Mode Action */}
      <button
        onClick={onGuest}
        className="w-full max-w-[280px] bg-blue hover:bg-blue-dark text-white rounded-[16px] py-4 px-6 text-[16px] font-black uppercase tracking-wide border-b-4 border-blue-dark active:border-b-0 active:translate-y-[4px] transition-all shadow-[0_4px_0_var(--color-blue-dark)] mb-4"
      >
        Play as Guest (Offline)
      </button>

      {/* Dev Bypass Action */}
      <button
        onClick={() => { window.location.href = "/api/auth/mock-login"; }}
        className="w-full max-w-[280px] bg-gray2 hover:bg-gray-300 text-text rounded-[16px] py-4 px-6 text-[16px] font-black uppercase tracking-wide border-b-4 border-gray-400 active:border-b-0 active:translate-y-[4px] transition-all shadow-[0_4px_0_#9ca3af] mb-4"
      >
        Bypass Login (Dev Mode)
      </button>

      {/* Hackathon Note */}
      <div className="mt-8 pt-6 border-t-2 border-gray2 max-w-[280px]">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">
          Hackathon Edition
        </p>
        <p className="text-[12px] text-gray-500">
          Powered by Quran Foundation Content & User APIs + Quran MCP Server
        </p>
      </div>
    </div>
  );
}
