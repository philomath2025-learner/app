"use client";

import { useState, useEffect } from "react";

interface OnboardingScreenProps {
  onLogin: () => void;
  onGuest: () => void;
}

export default function OnboardingScreen({ onLogin, onGuest }: OnboardingScreenProps) {
  const [step, setStep] = useState(1);
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    setIsLocalhost(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  }, []);

  const nextStep = () => {
    if (step < 5) setStep(step + 1);
  };

  const renderProgress = () => {
    return (
      <div className="flex gap-2 mb-8 mt-4">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className={`h-2 w-8 rounded-full transition-colors ${s === step ? "bg-green" : s < step ? "bg-green-light" : "bg-gray2"
              }`}
          />
        ))}
      </div>
    );
  };

  if (step === 1) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in overflow-y-auto min-h-full">
        {renderProgress()}

        <div className="w-48 h-48 mb-8 animate-float mt-auto">
          <img src="/logo.png" alt="QuranLingo Logo" className="w-full h-full object-contain" />
        </div>

        <h1 className="text-[28px] font-black text-text mb-3 leading-tight">
          Learn Quranic Vocabulary
          <br />
          <span className="text-green">Root by Root</span>
        </h1>

        <p className="text-[15px] text-text-light mb-10 max-w-[280px]">
          Inspired by How Human Brain Works!
        </p>

        <button
          onClick={nextStep}
          className="w-full max-w-[280px] bg-green hover:bg-[#46A302] text-white rounded-[16px] py-4 px-6 text-[16px] font-black uppercase tracking-wide border-b-4 border-[#3D8F02] active:border-b-0 active:translate-y-[4px] transition-all shadow-[0_4px_0_#3D8F02] mt-auto mb-4"
        >
          Continue
        </button>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in overflow-y-auto min-h-full">
        {renderProgress()}

        <div className="text-[80px] mb-6 drop-shadow-md mt-auto">🌱</div>

        <h2 className="text-[24px] font-black text-text mb-4">What are Roots?</h2>

        <p className="text-[16px] text-text-light mb-10 max-w-[280px] leading-relaxed">
          Most Arabic words are built from 3-letter roots. By learning just one root, you unlock dozens of words in the Quran!
        </p>

        <button
          onClick={nextStep}
          className="w-full max-w-[280px] bg-green hover:bg-[#46A302] text-white rounded-[16px] py-4 px-6 text-[16px] font-black uppercase tracking-wide border-b-4 border-[#3D8F02] active:border-b-0 active:translate-y-[4px] transition-all shadow-[0_4px_0_#3D8F02] mt-auto mb-4"
        >
          Fascinating!
        </button>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in overflow-y-auto min-h-full">
        {renderProgress()}

        <div className="text-[80px] mb-6 drop-shadow-md mt-auto">🧠</div>

        <h2 className="text-[24px] font-black text-text mb-4 leading-tight">Learn Once,<br />Know Everywhere</h2>

        <p className="text-[16px] text-text-light mb-10 max-w-[280px] leading-relaxed">
          Our smart Deduplication Engine ensures you only learn a root the first time it appears. No redundant learning.
        </p>

        <button
          onClick={nextStep}
          className="w-full max-w-[280px] bg-green hover:bg-[#46A302] text-white rounded-[16px] py-4 px-6 text-[16px] font-black uppercase tracking-wide border-b-4 border-[#3D8F02] active:border-b-0 active:translate-y-[4px] transition-all shadow-[0_4px_0_#3D8F02] mt-auto mb-4"
        >
          Makes Sense
        </button>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in overflow-y-auto min-h-full">
        {renderProgress()}

        <div className="flex gap-4 mb-6 drop-shadow-md text-[60px] mt-auto">
          <span>❤️</span>
          <span>🔥</span>
          <span>🏆</span>
        </div>

        <h2 className="text-[24px] font-black text-text mb-4">Stay Consistent</h2>

        <p className="text-[16px] text-text-light mb-10 max-w-[280px] leading-relaxed">
          Earn XP, keep your daily streak alive, and protect your hearts by reviewing your lessons carefully.
        </p>

        <button
          onClick={nextStep}
          className="w-full max-w-[280px] bg-green hover:bg-[#46A302] text-white rounded-[16px] py-4 px-6 text-[16px] font-black uppercase tracking-wide border-b-4 border-[#3D8F02] active:border-b-0 active:translate-y-[4px] transition-all shadow-[0_4px_0_#3D8F02] mt-auto mb-4"
        >
          I'm Ready!
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in overflow-y-auto min-h-full">
      {renderProgress()}

      <div className="w-40 h-40 mb-6 animate-float mt-auto">
        <img src="/logo.png" alt="QuranLingo Logo" className="w-full h-full object-contain" />
      </div>

      <h2 className="text-[24px] font-black text-text mb-8">Start Your Journey</h2>

      <div className="w-full mt-auto space-y-4">
        {/* Primary Action */}
        <button
          onClick={onLogin}
          className="w-full max-w-[280px] mx-auto bg-green hover:bg-[#46A302] text-white rounded-[16px] py-4 px-6 text-[16px] font-black uppercase tracking-wide border-b-4 border-[#3D8F02] active:border-b-0 active:translate-y-[4px] transition-all shadow-[0_4px_0_#3D8F02] block"
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
          className="w-full max-w-[280px] mx-auto bg-white hover:bg-gray-50 text-text rounded-[16px] py-4 px-6 text-[16px] font-black uppercase tracking-wide border-b-4 border-gray-300 active:border-b-0 active:translate-y-[4px] transition-all shadow-[0_4px_0_#d1d5db] flex items-center justify-center gap-3"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          Login with Google
        </button>

        {/* Guest Mode Action */}
        {isLocalhost && (
          <button
            onClick={onGuest}
            className="w-full max-w-[280px] mx-auto bg-blue hover:bg-blue-dark text-white rounded-[16px] py-4 px-6 text-[16px] font-black uppercase tracking-wide border-b-4 border-blue-dark active:border-b-0 active:translate-y-[4px] transition-all shadow-[0_4px_0_var(--color-blue-dark)] block"
          >
            Play as Guest (Offline)
          </button>
        )}

        {/* Dev Bypass Action */}
        {isLocalhost && (
          <button
            onClick={() => { window.location.href = "/api/auth/mock-login"; }}
            className="w-full max-w-[280px] mx-auto bg-gray2 hover:bg-gray-300 text-text rounded-[16px] py-4 px-6 text-[16px] font-black uppercase tracking-wide border-b-4 border-gray-400 active:border-b-0 active:translate-y-[4px] transition-all shadow-[0_4px_0_#9ca3af] block"
          >
            Bypass Login (Dev Mode)
          </button>
        )}
      </div>

      {/* Footer Note */}
      <div className="mt-8 pt-6 border-t-2 border-gray2 max-w-[280px] pb-4">
        <p className="text-[12px] text-gray-500">
          Powered by Quran Foundation Content & User APIs + Quran MCP Server
        </p>
      </div>
    </div>
  );
}
