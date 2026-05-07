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
  return (
    <div className="flex-1 overflow-y-auto p-3.5">
      <h2 className="text-[18px] font-black text-text mb-4">⚙️ {T("settings")}</h2>

      {/* Content Language */}
      <div className="bg-white border-2 border-gray2 rounded-[var(--radius-card)] p-3 mb-3">
        <div className="text-[11px] font-extrabold text-text-light uppercase tracking-wide mb-2">
          {T("language")}
        </div>
        <div className="flex gap-2">
          {Object.entries(LANGUAGES).map(([code, info]) => (
            <button
              key={code}
              id={`lang-${code}`}
              onClick={() => onSetLang(code as LangCode)}
              className={`flex-1 py-2 px-3 rounded-[var(--radius-sm)] border-2 text-[13px] font-bold cursor-pointer transition-all ${
                lang === code
                  ? "border-blue bg-blue-light text-blue-dark"
                  : "border-gray2 bg-white text-text-light"
              }`}
            >
              {info.flag} {info.label}
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div className="bg-white border-2 border-gray2 rounded-[var(--radius-card)] p-3 mb-3">
        <div className="text-[11px] font-extrabold text-text-light uppercase tracking-wide mb-2">
          App Theme
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onSetTheme("light")}
            className={`flex-1 py-2 rounded-[var(--radius-sm)] border-2 text-[13px] font-bold cursor-pointer transition-all ${
              theme === "light"
                ? "border-blue bg-blue-light text-blue-dark"
                : "border-gray2 bg-white text-text-light"
            }`}
          >
            ☀️ Light
          </button>
          <button
            onClick={() => onSetTheme("dark")}
            className={`flex-1 py-2 rounded-[var(--radius-sm)] border-2 text-[13px] font-bold cursor-pointer transition-all ${
              theme === "dark"
                ? "border-purple bg-purple-light text-purple-dark"
                : "border-gray2 bg-white text-text-light"
            }`}
          >
            🌙 Dark
          </button>
        </div>
      </div>

      {/* Review Limit */}
      <div className="bg-white border-2 border-gray2 rounded-[var(--radius-card)] p-3 mb-3">
        <div className="text-[11px] font-extrabold text-text-light uppercase tracking-wide mb-2">
          {T("reviewLimit")}
        </div>
        <div className="flex gap-2">
          {[10, 20, 30, 50].map((n) => (
            <button
              key={n}
              onClick={() => onSetReviewLimit(n)}
              className={`flex-1 py-2 rounded-[var(--radius-sm)] border-2 text-[13px] font-bold cursor-pointer transition-all ${
                reviewLimit === n
                  ? "border-green bg-green-light text-green-dark"
                  : "border-gray2 bg-white text-text-light"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* New Words Limit */}
      <div className="bg-white border-2 border-gray2 rounded-[var(--radius-card)] p-3 mb-3">
        <div className="text-[11px] font-extrabold text-text-light uppercase tracking-wide mb-2">
          {T("newWordsLimit")}
        </div>
        <div className="flex gap-2">
          {[5, 10, 15, 20].map((n) => (
            <button
              key={n}
              onClick={() => onSetNewWordsLimit(n)}
              className={`flex-1 py-2 rounded-[var(--radius-sm)] border-2 text-[13px] font-bold cursor-pointer transition-all ${
                newWordsLimit === n
                  ? "border-green bg-green-light text-green-dark"
                  : "border-gray2 bg-white text-text-light"
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
          className="w-full bg-white border-2 border-red-200 text-red-500 hover:bg-red-50 rounded-[var(--radius-card)] py-3 font-bold text-[14px] transition-colors"
        >
          Sign Out / Switch Mode
        </button>

        <button
          onClick={onResetProgress}
          className="w-full bg-red text-white border-2 border-red-dark hover:bg-red-dark rounded-[var(--radius-card)] py-3 font-bold text-[14px] transition-colors shadow-[0_4px_0_var(--color-red-dark)] active:scale-95"
        >
          🚨 Reset All Progress
        </button>
      </div>

      {/* App Info */}
      <div className="text-center mt-6">
        <div className="text-[11px] text-text-light font-bold">QuranLingo v1.0</div>
        <div className="text-[10px] text-gray1 mt-1">
          Quran Foundation Hackathon 2026
        </div>
      </div>
    </div>
  );
}
