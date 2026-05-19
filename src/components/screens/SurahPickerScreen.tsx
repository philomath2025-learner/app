"use client";

import { useState, useEffect, useMemo } from "react";
import { getPickerSurahs, getSurahById, type SurahInfo } from "@/data/surah-data";
import { getStorageProvider } from "@/lib/storage";
import type { SurahProgress } from "@/lib/storage/interface";

interface SurahPickerScreenProps {
  theme: "light" | "dark";
  storageMode: "guest" | "cloud";
  onSelectSurah: (surahId: number) => void;
  onGoHome: () => void;
}

type SortKey = "verses" | "words" | "id";
type FilterKey = "all" | "Meccan" | "Medinan";

export default function SurahPickerScreen({ theme, storageMode, onSelectSurah, onGoHome }: SurahPickerScreenProps) {
  const isDark = theme === "dark";
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("verses");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [progress, setProgress] = useState<SurahProgress>({ completedSurahs: [], currentSurahId: 1, surahAyahMap: {} });

  useEffect(() => {
    async function load() {
      const provider = getStorageProvider(storageMode);
      const p = await provider.getSurahProgress();
      setProgress(p);
    }
    load();
  }, [storageMode]);

  const allSurahs = useMemo(() => getPickerSurahs(), []);

  const filtered = useMemo(() => {
    let list = allSurahs;
    if (filter !== "all") list = list.filter(s => s.revelation === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(s =>
        s.nameEn.toLowerCase().includes(q) ||
        s.nameAr.includes(q) ||
        s.meaningEn.toLowerCase().includes(q) ||
        String(s.id) === q
      );
    }
    if (sortBy === "id") return [...list].sort((a, b) => a.id - b.id);
    if (sortBy === "words") return [...list].sort((a, b) => a.words - b.words || a.verses - b.verses);
    return [...list].sort((a, b) => a.verses - b.verses || a.words - b.words);
  }, [allSurahs, filter, search, sortBy]);

  const completedSet = new Set(progress.completedSurahs);
  const completedCount = completedSet.size + (completedSet.has(1) ? 0 : 0); // Fatiha always counted separately
  const totalFatihaCompleted = progress.completedSurahs.includes(1) ? 1 : 0;

  const bgMain = isDark ? "bg-[#0B1121]" : "bg-[#F0F4F8]";
  const cardBg = isDark ? "bg-[#152336] border-[#1E314A]" : "bg-white border-gray-100";
  const mutedText = isDark ? "text-[#50728D]" : "text-text-light";
  const mainText = isDark ? "text-white" : "text-text";
  const accentText = isDark ? "text-[#60E0C1]" : "text-blue";
  const inputBg = isDark ? "bg-[#101826] border-[#1E314A] text-white placeholder:text-[#3A5068]" : "bg-white border-gray-200 text-text placeholder:text-gray-400";

  return (
    <div className={`flex-1 flex flex-col overflow-hidden ${bgMain} transition-colors duration-300`}>
      {/* Header */}
      <div className={`p-4 pb-0`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className={`text-[20px] font-black ${mainText}`}>Choose Your Next Surah</h2>
            <p className={`text-[12px] font-bold ${mutedText}`}>
              {completedSet.size + totalFatihaCompleted} of 114 surahs completed
            </p>
          </div>
          <button
            onClick={onGoHome}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-[#1E314A] text-white hover:bg-[#284155]' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
          >✕</button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by name, meaning, or number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full px-4 py-3 rounded-2xl border-2 text-[14px] font-bold outline-none transition-colors mb-3 ${inputBg}`}
        />

        {/* Sort & Filter Row */}
        <div className="flex gap-2 mb-3">
          {/* Sort Chips */}
          <div className={`flex p-1 rounded-xl flex-1 ${isDark ? 'bg-[#101826]' : 'bg-gray-100'}`}>
            {([["verses", "Ayahs"], ["words", "Words"], ["id", "Chapter"]] as [SortKey, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`flex-1 py-2 text-[11px] font-extrabold rounded-lg transition-all ${
                  sortBy === key
                    ? (isDark ? 'bg-[#202E45] text-white shadow-sm' : 'bg-white text-blue shadow-sm')
                    : (isDark ? 'text-[#50728D]' : 'text-gray-500')
                }`}
              >{label}</button>
            ))}
          </div>
          {/* Filter */}
          <div className={`flex p-1 rounded-xl ${isDark ? 'bg-[#101826]' : 'bg-gray-100'}`}>
            {(["all", "Meccan", "Medinan"] as FilterKey[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 text-[11px] font-extrabold rounded-lg transition-all ${
                  filter === f
                    ? (isDark ? 'bg-[#202E45] text-white shadow-sm' : 'bg-white text-blue shadow-sm')
                    : (isDark ? 'text-[#50728D]' : 'text-gray-500')
                }`}
              >{f === "all" ? "All" : f}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Surah List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="flex flex-col gap-2">
          {filtered.map(surah => {
            const isCompleted = completedSet.has(surah.id);
            const isInProgress = !isCompleted && progress.surahAyahMap[surah.id] && progress.surahAyahMap[surah.id] > 0;
            const currentVerse = progress.surahAyahMap[surah.id] || 0;

            return (
              <button
                key={surah.id}
                onClick={() => onSelectSurah(surah.id)}
                className={`w-full text-left p-4 border-2 rounded-2xl flex items-center gap-3 transition-all duration-200 active:scale-[0.98] ${
                  isCompleted
                    ? (isDark ? 'bg-[#101F18] border-[#1B3627] opacity-75' : 'bg-[#EBFDF3] border-[#C2F4D8] opacity-80')
                    : isInProgress
                      ? (isDark ? 'bg-[#1A2540] border-[#60E0C1]/30' : 'bg-blue-50 border-blue/20')
                      : (isDark ? 'bg-[#152336] border-[#1E314A] hover:border-[#284155]' : 'bg-white border-gray-100 hover:border-blue/30')
                }`}
              >
                {/* Surah Number */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-[14px] font-black shrink-0 ${
                  isCompleted
                    ? 'bg-green/20 text-green'
                    : isInProgress
                      ? (isDark ? 'bg-[#284155] text-[#60E0C1]' : 'bg-blue-100 text-blue')
                      : (isDark ? 'bg-[#1E314A] text-[#50728D]' : 'bg-gray-100 text-gray-500')
                }`}>
                  {isCompleted ? '✓' : surah.id}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[14px] font-black truncate ${isCompleted ? (isDark ? 'text-[#60E0C1]' : 'text-green-dark') : mainText}`}>
                      {surah.nameEn}
                    </span>
                    <span className={`font-quran text-[16px] ${isCompleted ? (isDark ? 'text-[#60E0C1]/60' : 'text-green-dark/50') : (isDark ? 'text-[#A1B2C3]' : 'text-text-light')}`}>
                      {surah.nameAr}
                    </span>
                  </div>
                  <div className={`text-[11px] font-bold ${mutedText} flex items-center gap-1.5 mt-0.5`}>
                    <span>{surah.meaningEn}</span>
                    <span className="opacity-40">·</span>
                    <span>{surah.revelation}</span>
                  </div>
                  <div className={`text-[11px] font-bold ${mutedText} flex items-center gap-1.5 mt-0.5`}>
                    <span>{surah.verses} ayahs</span>
                    <span className="opacity-40">·</span>
                    <span>{surah.words} words</span>
                    {isInProgress && (
                      <>
                        <span className="opacity-40">·</span>
                        <span className={accentText}>{currentVerse}/{surah.verses} done</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Difficulty Badge */}
                <div className={`shrink-0 px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide ${
                  surah.verses <= 10
                    ? (isDark ? 'bg-[#1B3627] text-[#60E0C1]' : 'bg-green-light text-green-dark')
                    : surah.verses <= 50
                      ? (isDark ? 'bg-[#2A3520] text-[#D4AF37]' : 'bg-gold/10 text-gold')
                      : surah.verses <= 100
                        ? (isDark ? 'bg-[#352C1A] text-orange' : 'bg-orange/10 text-orange')
                        : (isDark ? 'bg-[#35201A] text-red' : 'bg-red/10 text-red')
                }`}>
                  {surah.verses <= 10 ? 'Easy' : surah.verses <= 50 ? 'Medium' : surah.verses <= 100 ? 'Long' : 'Epic'}
                </div>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <div className="text-[40px] mb-3">🔍</div>
              <p className={`text-[14px] font-bold ${mutedText}`}>No surahs match your search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
