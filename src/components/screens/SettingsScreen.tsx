"use client";

import { useState, useEffect, useMemo } from "react";
import { POPULAR_LANGUAGES, LANGUAGES, type LangCode } from "@/lib/constants";
import { T } from "@/lib/i18n";

interface QFLanguageItem {
  id: number;
  name: string;
  iso_code: string;
  native_name: string;
  direction: "ltr" | "rtl";
  translations_count: number;
}

interface QFTranslationItem {
  id: number;
  name: string;
  author_name: string;
  language_name: string;
}

// Known QF API word-by-word supported languages
const SUPPORTED_WBW_LANGUAGES = ['en', 'ur', 'id', 'bn', 'ta', 'hi', 'tr', 'fa'];

interface SettingsScreenProps {
  lang: LangCode;
  translationId: number | null;
  tafsirId: number | null;
  theme: "light" | "dark";
  reviewLimit: number;
  newWordsLimit: number;
  onSetLang: (code: LangCode, translationId?: number, tafsirId?: number) => void;
  onSetTheme: (theme: "light" | "dark") => void;
  onSetReviewLimit: (n: number) => void;
  onSetNewWordsLimit: (n: number) => void;
  onResetProgress: () => void;
}

export default function SettingsScreen({
  lang,
  translationId,
  tafsirId,
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

  // Language picker modal
  const [showLangModal, setShowLangModal] = useState(false);
  const [allLanguages, setAllLanguages] = useState<QFLanguageItem[]>([]);
  const [langSearch, setLangSearch] = useState("");
  const [loadingLangs, setLoadingLangs] = useState(false);

  // Translation edition picker (Now a Modal)
  const [showTranslations, setShowTranslations] = useState(false);
  const [translations, setTranslations] = useState<QFTranslationItem[]>([]);
  const [loadingTranslations, setLoadingTranslations] = useState(false);

  // Helper to get pure name without flag
  const getLangName = (code: string) => {
    const all = allLanguages.find((l) => l.iso_code === code);
    if (all) return all.name;
    const popular = POPULAR_LANGUAGES.find((l) => l.code === code);
    if (popular) return popular.label;
    const legacy = LANGUAGES[code];
    if (legacy) return legacy.label;
    return code.toUpperCase();
  };

  const currentWbwLangLabel = useMemo(() => getLangName(lang), [lang, allLanguages]);

  // Fetch all languages and pre-calculate real translation counts
  useEffect(() => {
    if (!showLangModal || allLanguages.length > 0) return;
    setLoadingLangs(true);
    
    // Fetch both languages and the full translations list to get accurate counts
    Promise.all([
      fetch("/api/languages").then(r => r.json()),
      fetch("https://api.quran.com/api/v4/resources/translations").then(r => r.json())
    ])
      .then(([langData, transData]) => {
        const langs: QFLanguageItem[] = langData.languages || [];
        const allTrans = transData.translations || [];

        // Manual mapping for precision (sync with backend ISO_TO_NAME)
        const ISO_TO_NAME: Record<string, string> = {
          en: "english", ta: "tamil", ur: "urdu", tr: "turkish", fr: "french",
          id: "indonesian", hi: "hindi", ml: "malayalam", bn: "bengali"
        };

        const enrichedLangs = langs
          .filter(l => SUPPORTED_WBW_LANGUAGES.includes(l.iso_code))
          .map(l => {
            const expected = ISO_TO_NAME[l.iso_code] || l.name.toLowerCase();
            const realCount = allTrans.filter((t: QFTranslationItem) => t.language_name.toLowerCase().includes(expected)).length;
            return { ...l, translations_count: realCount };
          });

        enrichedLangs.sort((a, b) => a.name.localeCompare(b.name));
        setAllLanguages(enrichedLangs);
      })
      .catch(() => setAllLanguages([]))
      .finally(() => setLoadingLangs(false));
  }, [showLangModal, allLanguages.length]);

  // Fetch translations for the current language (always keep in sync to show name on button)
  useEffect(() => {
    setLoadingTranslations(true);
    fetch(`/api/languages?translations=${lang}`)
      .then((r) => r.json())
      .then((d) => setTranslations(d.translations || []))
      .catch(() => setTranslations([]))
      .finally(() => setLoadingTranslations(false));
  }, [lang]);

  // Filtered languages for search
  const filteredLanguages = useMemo(() => {
    if (!langSearch.trim()) return allLanguages;
    const q = langSearch.toLowerCase();
    return allLanguages.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.native_name?.toLowerCase().includes(q) ||
        l.iso_code.toLowerCase().includes(q)
    );
  }, [allLanguages, langSearch]);

  const handleSelectLanguage = (isoCode: string) => {
    onSetLang(isoCode);
    setShowLangModal(false);
    setLangSearch("");
  };

  const handleSelectTranslation = (id: number) => {
    onSetLang(lang, id, tafsirId ?? undefined);
    setShowTranslations(false);
  };

  return (
    <div className={`flex-1 overflow-y-auto p-4 transition-colors duration-300 ${isDark ? 'bg-[#0B1121]' : 'bg-[#F0F4F8]'}`}>
      <h2 className={`text-[20px] font-black mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-text'}`}>
        <span className="p-2 bg-white/10 rounded-xl">⚙️</span> {T("settings")}
      </h2>

      {/* ── Content Language (Premium Design) ── */}
      <div className={`rounded-2xl p-5 mb-4 transition-all duration-300 relative overflow-hidden ${
        isDark 
          ? 'bg-gradient-to-br from-[#1A2639] to-[#0F1623] border border-[#2A3F54] shadow-lg shadow-black/20' 
          : 'bg-gradient-to-br from-white to-blue-50 border border-blue-100 shadow-xl shadow-blue-900/5'
      }`}>
        {/* Subtle background accent */}
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -mr-10 -mt-10 pointer-events-none ${isDark ? 'bg-[#60E0C1]' : 'bg-blue-400'}`}></div>

        {/* --- Word-by-Word Section --- */}
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className={`text-[12px] font-black uppercase tracking-widest ${isDark ? 'text-[#60E0C1]' : 'text-blue-600'}`}>
            Word-by-Word
          </div>
        </div>

        <button
          onClick={() => setShowLangModal(true)}
          className={`w-full flex items-center justify-between p-4 mb-5 rounded-xl transition-all duration-300 group relative z-10 ${
            isDark 
              ? 'bg-[#101826]/80 hover:bg-[#152336] border border-[#1E314A] hover:border-[#60E0C1]/50 shadow-md shadow-black/20' 
              : 'bg-white hover:bg-blue-50/80 border border-gray-100 hover:border-blue-300 shadow-sm hover:shadow-md hover:shadow-blue-900/5'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner ${isDark ? 'bg-gradient-to-br from-[#202E45] to-[#101826] border border-[#2A3F54]' : 'bg-gradient-to-br from-blue-50 to-white border border-blue-100'}`}>
              🔤
            </div>
            <div className="flex flex-col items-start">
              <span className={`text-[17px] font-bold ${isDark ? 'text-white group-hover:text-[#60E0C1]' : 'text-gray-900 group-hover:text-blue-700'} transition-colors`}>
                {currentWbwLangLabel}
              </span>
              <span className={`text-[12px] font-semibold mt-0.5 ${isDark ? 'text-[#50728D]' : 'text-gray-500'}`}>
                Tap to select language
              </span>
            </div>
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:translate-x-1 group-hover:scale-110 ${isDark ? 'bg-[#1E314A] text-[#50728D] group-hover:bg-[#60E0C1]/20 group-hover:text-[#60E0C1]' : 'bg-gray-50 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
            →
          </div>
        </button>

        <div className={`h-px w-full my-4 relative z-10 ${isDark ? 'bg-[#1E314A]' : 'bg-blue-200/50'}`}></div>

        {/* --- Ayah Translation Section --- */}
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className={`text-[12px] font-black uppercase tracking-widest ${isDark ? 'text-[#60E0C1]' : 'text-blue-600'}`}>
            Ayah Translation
          </div>
        </div>

        {translationId && (
          <button
            onClick={() => setShowTranslations(true)}
            className={`w-full flex items-center justify-between p-4 mb-3 rounded-xl transition-all duration-300 group relative z-10 ${
              isDark 
                ? 'bg-[#101826]/80 hover:bg-[#152336] border border-[#1E314A] hover:border-[#60E0C1]/50 shadow-md shadow-black/20' 
                : 'bg-white hover:bg-blue-50/80 border border-gray-100 hover:border-blue-300 shadow-sm hover:shadow-md hover:shadow-blue-900/5'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner ${isDark ? 'bg-gradient-to-br from-[#202E45] to-[#101826] border border-[#2A3F54]' : 'bg-gradient-to-br from-blue-50 to-white border border-blue-100'}`}>
                📖
              </div>
              <div className="flex flex-col items-start truncate pr-2">
                <span className={`text-[15px] font-bold truncate ${isDark ? 'text-white group-hover:text-[#60E0C1]' : 'text-gray-900 group-hover:text-blue-700'} transition-colors`}>
                  {translations.find(t => t.id === translationId)?.name || "Translation Edition"}
                </span>
                <span className={`text-[12px] font-semibold mt-0.5 ${isDark ? 'text-[#50728D]' : 'text-gray-500'}`}>
                  Tap to change edition
                </span>
              </div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:translate-x-1 group-hover:scale-110 shrink-0 ${isDark ? 'bg-[#1E314A] text-[#50728D] group-hover:bg-[#60E0C1]/20 group-hover:text-[#60E0C1]' : 'bg-gray-50 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
              →
            </div>
          </button>
        )}
      </div>

      {/* ── Theme ── */}
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

      {/* ── Review Limit ── */}
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

      {/* ── New Words Limit ── */}
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

      {/* ── Account Settings ── */}
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

      {/* ── App Info ── */}
      <div className="text-center mt-8 pb-4">
        <div className={`text-[12px] font-black uppercase tracking-widest ${isDark ? 'text-[#50728D]' : 'text-text-light'}`}>QuranLingo v1.0</div>
        <div className={`text-[10px] mt-1 font-bold ${isDark ? 'text-[#1E314A]' : 'text-gray1'}`}>
          Quran Foundation Hackathon 2026
        </div>
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* ── LANGUAGE PICKER MODAL ── */}
      {/* ══════════════════════════════════════════════ */}
      {showLangModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowLangModal(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal */}
          <div
            className={`relative w-full max-w-[400px] max-h-[70vh] rounded-[24px] border-2 flex flex-col overflow-hidden shadow-2xl animate-fade-in ${
              isDark ? 'bg-[#0B1121] border-[#1E314A]' : 'bg-white border-gray2'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`p-5 pb-3 border-b-2 ${isDark ? 'border-[#1E314A]' : 'border-gray2'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-[17px] font-black ${isDark ? 'text-white' : 'text-text'}`}>
                  🌐 Select Language
                </h3>
                <button
                  onClick={() => setShowLangModal(false)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[16px] font-bold transition-colors ${
                    isDark ? 'bg-[#152336] text-[#50728D] hover:text-white' : 'bg-gray3 text-gray1 hover:text-text'
                  }`}
                >
                  ✕
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className={`h-4 w-4 ${isDark ? 'text-[#50728D]' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-[14px] font-medium outline-none border-2 focus:border-blue ${
                    isDark
                      ? 'bg-[#152336] border-[#1E314A] text-white placeholder-[#50728D]'
                      : 'bg-gray3 border-transparent text-text placeholder-gray1'
                  }`}
                  placeholder={T("searchLanguages")}
                  value={langSearch}
                  onChange={(e) => setLangSearch(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* Language List */}
            <div className="flex-1 overflow-y-auto p-3">
              {loadingLangs ? (
                <div className="flex justify-center py-8">
                  <div className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
                </div>
              ) : filteredLanguages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-[28px] mb-2">🔍</div>
                  <p className={`text-[13px] font-bold ${isDark ? 'text-[#50728D]' : 'text-text-light'}`}>
                    No languages found
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {filteredLanguages.map((l) => {
                    const isActive = lang === l.iso_code;
                    return (
                      <button
                        key={l.id}
                        onClick={() => handleSelectLanguage(l.iso_code)}
                        className={`w-full text-left py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                          isActive
                            ? (isDark ? "border-[#60E0C1] bg-[#202E45]" : "border-blue bg-blue-light")
                            : (isDark ? "border-transparent hover:border-[#1E314A] hover:bg-[#152336]" : "border-transparent hover:border-gray2 hover:bg-gray3")
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-[14px] font-bold ${isActive ? (isDark ? 'text-[#60E0C1]' : 'text-blue-dark') : (isDark ? 'text-white' : 'text-text')}`}>
                            {l.name}
                          </span>
                          {SUPPORTED_WBW_LANGUAGES.includes(l.iso_code) && (
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${isDark ? 'bg-[#60E0C1]/20 text-[#60E0C1]' : 'bg-blue-light text-blue-dark border border-blue/20'}`}>
                              &lt;WBW&gt;
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {l.direction === "rtl" && (
                            <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${isDark ? 'bg-[#352C4B] text-[#B495DF]' : 'bg-purple-light text-purple-dark'}`}>
                              RTL
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isDark ? 'bg-[#202E45] text-[#50728D]' : 'bg-gray3 text-gray1'}`}>
                            {l.translations_count} Editions
                          </span>
                          {isActive && (
                            <span className="text-[14px]">✓</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* ── TRANSLATION EDITION MODAL ── */}
      {/* ══════════════════════════════════════════════ */}
      {showTranslations && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowTranslations(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal */}
          <div
            className={`relative w-full max-w-[400px] max-h-[70vh] rounded-[24px] border-2 flex flex-col overflow-hidden shadow-2xl animate-fade-in ${
              isDark ? 'bg-[#0B1121] border-[#1E314A]' : 'bg-white border-gray2'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`p-5 pb-3 border-b-2 ${isDark ? 'border-[#1E314A]' : 'border-gray2'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-[17px] font-black ${isDark ? 'text-white' : 'text-text'}`}>
                  📖 Ayah Translation
                </h3>
                <button
                  onClick={() => setShowTranslations(false)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[16px] font-bold transition-colors ${
                    isDark ? 'bg-[#152336] text-[#50728D] hover:text-white' : 'bg-gray3 text-gray1 hover:text-text'
                  }`}
                >
                  ✕
                </button>
              </div>
              <p className={`text-[13px] font-semibold mb-2 ${isDark ? 'text-[#50728D]' : 'text-gray-500'}`}>
                Select an edition for {currentWbwLangLabel}. To change the language, use the Word-by-Word setting.
              </p>
            </div>

            {/* Editions List */}
            <div className="flex-1 overflow-y-auto p-3">
              {loadingTranslations ? (
                <div className="flex justify-center py-8">
                  <div className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
                </div>
              ) : translations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-[28px] mb-2">📚</div>
                  <p className={`text-[13px] font-bold ${isDark ? 'text-[#50728D]' : 'text-text-light'}`}>
                    No editions available
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {translations.map((t) => {
                    const isActive = translationId === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleSelectTranslation(t.id)}
                        className={`w-full text-left py-3.5 px-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                          isActive
                            ? (isDark ? "border-[#60E0C1] bg-[#202E45]" : "border-blue bg-blue-light")
                            : (isDark ? "border-transparent hover:border-[#1E314A] hover:bg-[#152336]" : "border-transparent hover:border-gray2 hover:bg-gray3")
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className={`text-[15px] font-bold ${isActive ? (isDark ? 'text-[#60E0C1]' : 'text-blue-dark') : (isDark ? 'text-white' : 'text-text')}`}>
                            {t.name}
                          </span>
                          <span className={`text-[12px] font-medium mt-0.5 ${isDark ? 'text-[#50728D]' : 'text-text-light'}`}>
                            {t.author_name}
                          </span>
                        </div>
                        {isActive && (
                          <span className="text-[16px]">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
