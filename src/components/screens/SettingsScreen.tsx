"use client";

import { LANGUAGES, type LangCode } from "@/lib/constants";
import { T } from "@/lib/i18n";

interface SettingsScreenProps {
  lang: LangCode;
  theme: "light" | "dark";
  reviewLimit: number;
  newWordsLimit: number;
  onSetLang: (code: LangCode) => void;
  onSetTheme: (theme: "light" | "dark") => void;
  onSetReviewLimit: (n: number) => void;
  onSetNewWordsLimit: (n: number) => void;
  onResetProgress: () => void;
}

export default function SettingsScreen({
  lang,
  theme,
  reviewLimit,
  newWordsLimit,
  onSetLang,
  onSetTheme,
  onSetReviewLimit,
  onSetNewWordsLimit,
  onResetProgress,
}: SettingsScreenProps) {
  const isDark = theme === "dark";
  return (
    <div className={`flex-1 overflow-y-auto p-4 transition-colors duration-300 ${isDark ? 'bg-[#0B1121]' : 'bg-[#F0F4F8]'}`}>
      <h2 className={`text-[20px] font-black mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-text'}`}>
        <span className="p-2 bg-white/10 rounded-xl">⚙️</span> {T("settings")}
      </h2>

      {/* Content Language */}
      <div className={`border-2 rounded-[var(--radius-card)] p-4 mb-4 transition-colors ${isDark ? 'bg-[#152336] border-[#1E314A]' : 'bg-white border-gray2'}`}>
        <div className={`text-[11px] font-black uppercase tracking-widest mb-4 ${isDark ? 'text-[#50728D]' : 'text-text-light'}`}>
          {T("language")}
        </div>
        <div className="flex gap-2">
          {Object.entries(LANGUAGES).map(([code, info]) => (
            <button
              key={code}
              id={`lang-${code}`}
              onClick={() => onSetLang(code as LangCode)}
              className={`flex-1 py-3 px-3 rounded-[var(--radius-sm)] border-2 text-[14px] font-bold cursor-pointer transition-all ${
                lang === code
                  ? (isDark ? "border-[#60E0C1] bg-[#202E45] text-[#60E0C1]" : "border-blue bg-blue-light text-blue-dark")
                  : (isDark ? "border-[#1E314A] bg-[#101826] text-[#50728D]" : "border-gray2 bg-white text-text-light")
              }`}
            >
              {info.flag} {info.label}
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div className={`border-2 rounded-[var(--radius-card)] p-4 mb-4 transition-colors ${isDark ? 'bg-[#152336] border-[#1E314A]' : 'bg-white border-gray2'}`}>
        <div className={`text-[11px] font-black uppercase tracking-widest mb-4 ${isDark ? 'text-[#50728D]' : 'text-text-light'}`}>
          App Theme
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onSetTheme("light")}
            className={`flex-1 py-3 rounded-[var(--radius-sm)] border-2 text-[14px] font-bold cursor-pointer transition-all ${
              theme === "light"
                ? "border-blue bg-blue-light text-blue-dark"
                : (isDark ? "border-[#1E314A] bg-[#101826] text-[#50728D]" : "border-gray2 bg-white text-text-light")
            }`}
          >
            ☀️ Light
          </button>
          <button
            onClick={() => onSetTheme("dark")}
            className={`flex-1 py-3 rounded-[var(--radius-sm)] border-2 text-[14px] font-bold cursor-pointer transition-all ${
              theme === "dark"
                ? (isDark ? "border-[#60E0C1] bg-[#202E45] text-[#60E0C1]" : "border-purple bg-purple-light text-purple-dark")
                : (isDark ? "border-[#1E314A] bg-[#101826] text-[#50728D]" : "border-gray2 bg-white text-text-light")
            }`}
          >
            🌙 Dark
          </button>
        </div>
      </div>

      {/* Review Limit */}
      <div className={`border-2 rounded-[var(--radius-card)] p-4 mb-4 transition-colors ${isDark ? 'bg-[#152336] border-[#1E314A]' : 'bg-white border-gray2'}`}>
        <div className={`text-[11px] font-black uppercase tracking-widest mb-4 ${isDark ? 'text-[#50728D]' : 'text-text-light'}`}>
          {T("reviewLimit")}
        </div>
        <div className="flex gap-2">
          {[10, 20, 30, 50].map((n) => (
            <button
              key={n}
              onClick={() => onSetReviewLimit(n)}
              className={`flex-1 py-3 rounded-[var(--radius-sm)] border-2 text-[14px] font-bold cursor-pointer transition-all ${
                reviewLimit === n
                  ? "border-green bg-green-light text-green-dark"
                  : (isDark ? "border-[#1E314A] bg-[#101826] text-[#50728D]" : "border-gray2 bg-white text-text-light")
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* New Words Limit */}
      <div className={`border-2 rounded-[var(--radius-card)] p-4 mb-4 transition-colors ${isDark ? 'bg-[#152336] border-[#1E314A]' : 'bg-white border-gray2'}`}>
        <div className={`text-[11px] font-black uppercase tracking-widest mb-4 ${isDark ? 'text-[#50728D]' : 'text-text-light'}`}>
          {T("newWordsLimit")}
        </div>
        <div className="flex gap-2">
          {[5, 10, 15, 20].map((n) => (
            <button
              key={n}
              onClick={() => onSetNewWordsLimit(n)}
              className={`flex-1 py-3 rounded-[var(--radius-sm)] border-2 text-[14px] font-bold cursor-pointer transition-all ${
                newWordsLimit === n
                  ? "border-green bg-green-light text-green-dark"
                  : (isDark ? "border-[#1E314A] bg-[#101826] text-[#50728D]" : "border-gray2 bg-white text-text-light")
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Account Settings */}
      <div className="mt-6 mb-2 flex flex-col gap-2">
        <button
          onClick={() => {
            document.cookie = "qf_logged_in=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "sb_custom_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            window.location.reload();
          }}
          className={`w-full border-2 rounded-[var(--radius-card)] py-4 font-black text-[14px] transition-colors uppercase tracking-widest mb-2 ${isDark ? 'bg-[#101826] border-red-900/30 text-red-400 hover:bg-red-950/20' : 'bg-white border-red-100 text-red-500 hover:bg-red-50'}`}
        >
          Sign Out / Switch Mode
        </button>

        <button
          onClick={onResetProgress}
          className="w-full bg-red text-white border-2 border-red-dark hover:bg-red-dark rounded-[var(--radius-card)] py-4 font-black text-[14px] transition-colors shadow-[0_4px_0_#991B1B] active:translate-y-1 active:border-b-0 uppercase tracking-widest"
        >
          🚨 Reset All Progress
        </button>
      </div>

      {/* App Info */}
      <div className="text-center mt-8 pb-4">
        <div className={`text-[12px] font-black uppercase tracking-widest ${isDark ? 'text-[#50728D]' : 'text-text-light'}`}>QuranLingo v1.0</div>
        <div className={`text-[10px] mt-1 font-bold ${isDark ? 'text-[#1E314A]' : 'text-gray1'}`}>
          Quran Foundation Hackathon 2026
        </div>
      </div>
    </div>
  );
}
