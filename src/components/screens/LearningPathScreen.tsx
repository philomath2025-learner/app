"use client";

import { useState, useEffect, useMemo } from "react";
import { getStorageProvider } from "@/lib/storage";
import type { SurahProgress } from "@/lib/storage/interface";
import { SURAHS as ALL_SURAHS, getSurahsSortedByDifficulty } from "@/data/surah-data";

interface LearningPathScreenProps {
  currentAyah: string;
  storageMode: "guest" | "cloud";
  theme: "light" | "dark";
  onNavigate: (screenId: "quiz" | "home" | "lesson") => void;
}

export default function LearningPathScreen({ currentAyah, storageMode, theme, onNavigate }: LearningPathScreenProps) {
  const isDark = theme === "dark";
  const [currentSurahId, currentVerse] = currentAyah.split(":").map(Number);
  const [expandedSurahId, setExpandedSurahId] = useState<number | null>(currentSurahId);
  const [loading, setLoading] = useState(true);
  const [surahProgress, setSurahProgress] = useState<SurahProgress>({
    completedSurahs: [], currentSurahId: 1, surahAyahMap: {}
  });

  useEffect(() => {
    async function loadProgress() {
      const provider = getStorageProvider(storageMode);
      const progress = await provider.getSurahProgress();
      setSurahProgress(progress);
      setLoading(false);
    }
    loadProgress();
  }, [storageMode]);

  const completedSet = useMemo(() => new Set(surahProgress.completedSurahs), [surahProgress]);

  // Calculate real stats from surah progress
  const stats = useMemo(() => {
    let totalCompleted = 0;
    for (const [, versesDone] of Object.entries(surahProgress.surahAyahMap)) {
      totalCompleted += Number(versesDone);
    }
    const completedSurahCount = surahProgress.completedSurahs.length;
    const totalSurahs = 114;
    const totalAyahs = 6236;
    const remaining = totalAyahs - totalCompleted;

    return {
      completedAyahs: totalCompleted,
      completedSurahs: completedSurahCount,
      totalSurahs,
      remaining,
    };
  }, [surahProgress]);

  // Show surahs sorted by difficulty (same as picker) for the map, but pull Al-Fatiha to the very top
  const sortedSurahs = useMemo(() => {
    const list = getSurahsSortedByDifficulty();
    const fatihaIndex = list.findIndex(s => s.id === 1);
    if (fatihaIndex > -1) {
      const [fatiha] = list.splice(fatihaIndex, 1);
      list.unshift(fatiha);
    }
    return list;
  }, []);

  return (
    <div className={`flex-1 overflow-y-auto font-['DM_Sans'] pb-20 transition-colors duration-300 ${isDark ? 'bg-[#0B1121]' : 'bg-[#F0F4F8]'}`}>
      {/* Stats Header */}
      <div className="grid grid-cols-3 gap-2 p-3 pb-2">
        <StatBox label="COMPLETED" value={stats.completedAyahs} colorClass="text-green" bgColor="bg-green" isDark={isDark} />
        <StatBox label="SURAHS" value={`${stats.completedSurahs}/114`} colorClass={isDark ? "text-[#60E0C1]" : "text-blue"} bgColor="bg-blue" isDark={isDark} />
        <StatBox label="REMAINING" value={stats.remaining} colorClass={isDark ? "text-[#50728D]" : "text-gray1"} bgColor={isDark ? "bg-[#1E314A]" : "bg-gray2"} isDark={isDark} />
      </div>

      <div className="h-2" />

      {/* Surah Journey List */}
      <div className="px-4 space-y-3">
        {sortedSurahs.map(surah => {
          const isCompleted = completedSet.has(surah.id);
          const isActive = surah.id === currentSurahId;
          const versesCompleted = surahProgress.surahAyahMap[surah.id] || 0;
          const isInProgress = !isCompleted && versesCompleted > 0;
          const isExpanded = expandedSurahId === surah.id;

          return (
            <div key={surah.id} className="space-y-2">
              {/* Surah Header Card */}
              <button
                onClick={() => setExpandedSurahId(isExpanded ? null : surah.id)}
                className={`w-full text-left rounded-[20px] p-4 border-2 relative overflow-hidden transition-all hover:scale-[1.005] active:scale-[0.99] ${
                isCompleted
                  ? (isDark ? "bg-[#1A3D24] border-[#2D5A3A] text-[#60E0C1]" : "bg-[#D7FFB8] border-[#A3E635] text-green-dark")
                  : isActive
                  ? (isDark ? "bg-[#1A2540] border-[#60E0C1]/40 text-white" : "bg-blue-50 border-blue/30 text-text")
                  : isInProgress
                  ? (isDark ? "bg-[#152336] border-[#284155] text-white" : "bg-white border-blue/10 text-text")
                  : (isDark ? "bg-[#101826] border-[#1E314A] text-[#50728D]" : "bg-gray-50 border-gray-200 text-gray1")
              }`}>
                {isCompleted && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 text-[50px]">🌱</div>
                )}

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Surah Number Badge */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-black shrink-0 ${
                      isCompleted ? 'bg-green/20 text-green' :
                      isActive ? (isDark ? 'bg-[#284155] text-[#60E0C1]' : 'bg-blue/10 text-blue') :
                      (isDark ? 'bg-[#1E314A] text-[#50728D]' : 'bg-gray-200 text-gray-500')
                    }`}>
                      {isCompleted ? '✓' : surah.id}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {isCompleted && <span className="text-[10px] font-black uppercase tracking-tight">COMPLETE</span>}
                        {isActive && <span className={`text-[10px] font-black uppercase ${isDark ? 'text-[#60E0C1]' : 'text-blue'}`}>NOW STUDYING</span>}
                        {isInProgress && !isActive && <span className={`text-[10px] font-black uppercase ${isDark ? 'text-[#D4AF37]' : 'text-gold-dark'}`}>IN PROGRESS</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[16px] font-black truncate">{surah.nameEn}</span>
                        <span className={`font-quran text-[14px] ${isDark ? 'opacity-50' : 'opacity-40'}`}>{surah.nameAr}</span>
                      </div>
                      <div className={`text-[11px] font-bold opacity-70 mt-0.5`}>
                        {surah.verses} ayahs · {surah.words} words · {surah.revelation}
                        {(isInProgress || isActive) && ` · ${versesCompleted}/${surah.verses} done`}
                      </div>
                    </div>
                  </div>

                  {/* Chevron */}
                  <div className={`ml-2 transition-transform duration-300 shrink-0 ${isExpanded ? "rotate-180" : ""}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Progress bar for in-progress/active */}
                {(isInProgress || isActive) && !isCompleted && (
                  <div className="mt-3 h-[6px] bg-black/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-green to-[#7BED00] transition-[width] duration-500"
                      style={{ width: `${Math.round((versesCompleted / surah.verses) * 100)}%` }}
                    />
                  </div>
                )}
              </button>

              {/* Ayah Grid - Only shown when expanded */}
              {isExpanded && (
                <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 px-1 animate-fade-in">
                  {Array.from({ length: Math.min(surah.verses, 200) }, (_, i) => {
                    const verseNum = i + 1;

                    let state: "completed" | "current" | "upcoming" | "locked" = "locked";
                    if (isCompleted || verseNum <= versesCompleted) {
                      state = "completed";
                    } else if (surah.id === currentSurahId && verseNum === currentVerse) {
                      state = "current";
                    } else if (surah.id === currentSurahId && verseNum <= currentVerse + 5) {
                      state = "upcoming";
                    }

                    return (
                      <div
                        key={`${surah.id}:${verseNum}`}
                        className={`aspect-square rounded-[8px] flex items-center justify-center text-[11px] font-black transition-all ${
                          state === "completed" ? "bg-green text-white shadow-[0_2px_0_#46A302]" :
                          state === "current" ? "bg-gold text-white ring-3 ring-gold-light scale-110 z-10 shadow-[0_2px_0_#CE9200]" :
                          state === "upcoming" ? (isDark ? "bg-[#3D2E1A] text-[#FFB84D]" : "bg-[#FFDDB7] text-[#CE8200]") :
                          (isDark ? "bg-[#1E314A] text-[#50728D] opacity-40" : "bg-gray2 text-gray1 opacity-40")
                        }`}
                      >
                        {verseNum}
                      </div>
                    );
                  })}
                  {surah.verses > 200 && (
                    <div className={`col-span-full text-center py-3 rounded-xl mt-1 border-2 border-dashed ${isDark ? 'bg-[#101826]/50 border-[#1E314A]' : 'bg-white/50 border-gray2'}`}>
                       <span className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-[#50728D]' : 'text-gray1'}`}>
                         + {surah.verses - 200} more ayahs
                       </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatBox({ label, value, colorClass, bgColor, isDark }: { label: string; value: number | string; colorClass: string; bgColor: string; isDark: boolean }) {
  return (
    <div className={`rounded-[20px] p-3 shadow-sm border-2 flex flex-col items-center justify-center min-h-[75px] transition-colors ${
      isDark ? 'bg-[#152336] border-[#1E314A]' : 'bg-white border-gray2'
    }`}>
      <div className={`text-[20px] font-black ${colorClass} leading-none mb-2`}>{value}</div>
      <div className="flex items-center gap-1.5">
        <div className={`w-2.5 h-2.5 rounded-[3px] ${bgColor}`} />
        <div className={`text-[8px] font-black uppercase tracking-wider ${colorClass} opacity-80`}>{label}</div>
      </div>
    </div>
  );
}
