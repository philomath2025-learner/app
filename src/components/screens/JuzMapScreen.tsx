"use client";

import { useState, useEffect, useMemo } from "react";
import { getStorageProvider } from "@/lib/storage";

interface JuzMapScreenProps {
  currentAyah: string;
  storageMode: "guest" | "cloud";
  onNavigate: (screenId: "quiz" | "home" | "lesson") => void;
}

// Surah metadata for the map
const SURAHS = [
  { id: 1, name: "Al-Fatiha", nameAr: "الفاتحة", verses: 7, start: 1, totalRoots: 11, desc: "Journey starts here" },
  { id: 2, name: "Al-Baqarah", nameAr: "Al-Baqarah", verses: 286, start: 8, totalRoots: 142, desc: "The longest surah" },
  { id: 3, name: "Ali 'Imran", nameAr: "Ali 'Imran", verses: 200, start: 294, totalRoots: 108, desc: "The Family of Imran" },
];

export default function JuzMapScreen({ currentAyah, storageMode, onNavigate }: JuzMapScreenProps) {
  const [currentSurahId, currentVerse] = currentAyah.split(":").map(Number);
  const [expandedSurahId, setExpandedSurahId] = useState<number | null>(currentSurahId);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Derived stats for the header
  const stats = useMemo(() => {
    let totalCompleted = 0;
    if (currentSurahId === 1) {
      totalCompleted = currentVerse - 1;
    } else {
      totalCompleted = 7 + (currentVerse - 1);
    }

    const studied = Math.floor(totalCompleted * 0.45);
    const hasNew = totalCompleted - studied;
    const upcoming = 10; // Next 10 ayahs are "upcoming"
    const locked = 6236 - totalCompleted - 1 - upcoming;

    return { studied, hasNew, current: 1, upcoming, locked };
  }, [currentSurahId, currentVerse]);

  return (
    <div className="flex-1 bg-[#F0F4F8] overflow-y-auto font-['DM_Sans'] pb-20">
      {/* 1. Top Stats Row */}
      <div className="grid grid-cols-5 gap-1.5 p-3 pb-2">
        <StatBox label="STUDIED" value={stats.studied} colorClass="text-green" bgColor="bg-green" />
        <StatBox label="HAS NEW" value={stats.hasNew} colorClass="text-teal" bgColor="bg-teal" />
        <StatBox label="CURRENT" value={stats.current} colorClass="text-gold-dark" bgColor="bg-gold" />
        <StatBox label="NEXT" value={stats.upcoming} colorClass="text-[#CE8200]" bgColor="bg-orange-light" />
        <StatBox label="LOCKED" value={stats.locked} colorClass="text-gray1" bgColor="bg-gray2" />
      </div>

      <div className="h-2" /> {/* Spacer instead of legend */}

      {/* 3. Surah Journey List */}
      <div className="px-4 space-y-4">
        {SURAHS.map(surah => {
          const isCompleted = surah.id < currentSurahId;
          const isActive = surah.id === currentSurahId;
          const isLocked = surah.id > currentSurahId;
          const isExpanded = expandedSurahId === surah.id;

          return (
            <div key={surah.id} className="space-y-3">
              {/* Surah Header Card (Clickable to Expand) */}
              <button 
                onClick={() => setExpandedSurahId(isExpanded ? null : surah.id)}
                className={`w-full text-left rounded-[24px] p-5 border-2 relative overflow-hidden transition-all hover:scale-[1.01] active:scale-[0.99] ${
                isCompleted 
                  ? "bg-[#D7FFB8] border-[#A3E635] text-green-dark" 
                  : isLocked 
                  ? "bg-gray3 border-gray2 text-gray1 opacity-60"
                  : "bg-white border-gray2 text-text"
              }`}>
                {isCompleted && (
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-20 text-[60px]">🌱</div>
                )}
                
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      {isCompleted && <span className="text-[12px] font-black uppercase tracking-tight flex items-center gap-1">
                        <span className="text-[14px]">✓</span> COMPLETE
                      </span>}
                      {isActive && <span className="text-[12px] font-black uppercase text-blue-dark opacity-70">
                        NOW STUDYING → {surah.name.toUpperCase()}
                      </span>}
                      {isLocked && <span className="text-[12px] font-black uppercase opacity-60">LOCKED</span>}
                    </div>

                    <h3 className="text-[20px] font-black mb-1">
                      Surah {surah.name} ({surah.id}:1–{surah.verses})
                    </h3>
                    
                    <p className={`text-[13px] font-medium opacity-80`}>
                      {surah.totalRoots} unique roots introduced · {surah.desc}
                    </p>
                  </div>
                  
                  {/* Chevron Icon */}
                  <div className={`mt-2 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Ayah Grid - Only shown when expanded */}
              {isExpanded && (
                <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 px-1 animate-fade-in">
                  {Array.from({ length: surah.id === 2 ? Math.min(surah.verses, 141) : surah.verses }, (_, i) => {
                    const verseNum = i + 1;
                    const ayahKey = `${surah.id}:${verseNum}`;
                    
                    // State determination
                    let state: "studied" | "hasNew" | "current" | "upcoming" | "locked" = "locked";
                    
                    if (surah.id < currentSurahId || (surah.id === currentSurahId && verseNum < currentVerse)) {
                      state = (verseNum % 3 === 1) ? "hasNew" : "studied";
                    } else if (surah.id === currentSurahId && verseNum === currentVerse) {
                      state = "current";
                    } else if (surah.id === currentSurahId && verseNum <= currentVerse + 10) {
                      state = "upcoming";
                    }

                    return (
                      <button
                        key={ayahKey}
                        onClick={() => onNavigate("quiz")}
                        className={`aspect-square rounded-[8px] flex items-center justify-center text-[12px] font-black transition-all ${
                          state === "studied" ? "bg-green text-white shadow-[0_2px_0_#46A302]" :
                          state === "hasNew" ? "bg-teal text-white shadow-[0_2px_0_#008E80]" :
                          state === "current" ? "bg-gold text-white ring-4 ring-gold-light scale-110 z-10 shadow-[0_2px_0_#CE9200]" :
                          state === "upcoming" ? "bg-[#FFDDB7] text-[#CE8200]" :
                          "bg-gray2 text-gray1 opacity-40 cursor-not-allowed"
                        }`}
                      >
                        {verseNum}
                      </button>
                    );
                  })}
                  {surah.id === 2 && (
                    <div className="col-span-full text-center py-4 bg-white/50 rounded-xl mt-2 border-2 border-dashed border-gray2">
                       <span className="text-[11px] font-bold text-gray1 uppercase tracking-widest">
                         Ayahs 142+ coming soon
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

function StatBox({ label, value, colorClass, bgColor }: { label: string; value: number; colorClass: string; bgColor: string }) {
  return (
    <div className="bg-white rounded-[20px] p-2.5 shadow-sm border-2 border-gray2 flex flex-col items-center justify-center min-h-[75px]">
      <div className={`text-[22px] font-black ${colorClass} leading-none mb-2`}>{value}</div>
      <div className="flex items-center gap-1.5">
        <div className={`w-2.5 h-2.5 rounded-[3px] ${bgColor}`} />
        <div className={`text-[8px] font-black uppercase tracking-wider ${colorClass} opacity-80`}>{label}</div>
      </div>
    </div>
  );
}


