"use client";

import { useState, useEffect } from "react";
import { getLevel, getNextLevel, getAbsoluteAyah, LEVELS } from "@/lib/constants";
import { getStorageProvider } from "@/lib/storage";
import type { ReviewCard } from "@/lib/storage/interface";

interface HomeScreenProps {
  xp: number;
  dailyXp: number;
  targetXp: number;
  streak: number;
  currentAyah: string;
  storageMode: "guest" | "cloud";
  theme: "light" | "dark";
  onStartReview: () => void;
  onStartLesson: (ref: string) => void;
  onNavigateToRooms: () => void;
}

export default function HomeScreen({ xp, dailyXp, targetXp, streak, currentAyah, storageMode, theme, onStartReview, onStartLesson, onNavigateToRooms }: HomeScreenProps) {
  const isDark = theme === "dark";
  
  const absAyahs = getAbsoluteAyah(currentAyah);
  const lv = getLevel(absAyahs);
  const nx = getNextLevel(absAyahs);
  const ayahsToNext = nx ? nx.minAyahs - absAyahs : 0;

  const [learnedCount, setLearnedCount] = useState(0);
  const [dueCards, setDueCards] = useState<ReviewCard[]>([]);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      setIsLoading(true);
      const provider = getStorageProvider(storageMode);
      
      const knownPromise = provider.getKnownRoots();
      const prefsPromise = provider.getLocalPreferences();
      
      const [knownRoots, prefs] = await Promise.all([knownPromise, prefsPromise]);
      
      const reviewLimit = prefs.reviewLimit || 20;
      const due = await provider.getDueReviews(reviewLimit);
      
      // Batch state updates to prevent flickering
      setLearnedCount(knownRoots.size);
      setDueCards(due);
      setIsLoading(false);
    }
    loadHomeData();
  }, [storageMode]);

  // Format current ayah for display
  const [surahNum] = currentAyah.split(":");
  
  const pct = targetXp > 0 ? Math.min(100, Math.round((dailyXp / targetXp) * 100)) : 0;

  return (
    <div className={`flex-1 overflow-y-auto p-4 transition-colors duration-300 ${isDark ? 'bg-[#0B1121]' : 'bg-[#F0F4F8]'}`}>
      {/* Level Banner */}
      <button 
        onClick={() => setShowLevelModal(true)}
        className="w-full text-left bg-gradient-to-br from-blue to-purple rounded-[var(--radius-card)] p-4 mb-3 flex items-center justify-between text-white hover:opacity-90 active:scale-95 transition-all"
      >
        <div>
          <div className="text-[10px] font-bold opacity-80 uppercase tracking-wide mb-[2px]">Current QuranLingo's Level</div>
          <div className="text-[19px] font-black">{lv.name}</div>
          <div className="text-[11px] opacity-75 mt-[2px]">
            {nx ? `${ayahsToNext} Ayahs to ${nx.name}` : "Max level!"}
          </div>
        </div>
        <div className="text-[34px] w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">{lv.emoji}</div>
      </button>

      {/* Daily Goal */}
      <div className={`border-2 rounded-[var(--radius-card)] p-4 mb-3 transition-colors ${isDark ? 'bg-[#152336] border-[#1E314A]' : 'bg-white border-gray2'}`}>
        <div className="flex justify-between items-center mb-3">
          <span className={`text-[12px] font-black uppercase tracking-wider ${isDark ? 'text-[#50728D]' : 'text-text'}`}>Daily Goal</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-gray-400">{dailyXp} / {targetXp} XP</span>
            <span className="text-[12px] font-black text-green-dark">{pct}%</span>
          </div>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((segment) => (
            <div 
              key={segment} 
              className={`flex-1 h-[9px] rounded-full transition-all duration-500 ${pct >= segment * 20 ? "bg-green shadow-[0_0_8px_rgba(88,204,2,0.3)]" : "bg-gray2"}`} 
              />
          ))}
        </div>
        {pct >= 100 && (
          <div className="mt-2 text-[10px] font-black text-green-dark uppercase tracking-widest text-center animate-bounce">
            🎉 Daily Goal Met!
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { emoji: "📚", value: String(learnedCount), label: "Learned" },
          { emoji: "⚡", value: String(xp), label: "Total XP" },
          { emoji: "🔥", value: String(streak), label: "Streak" },
        ].map((s) => (
          <div key={s.label} className={`rounded-[var(--radius-sm)] p-3 text-center border-2 transition-colors ${isDark ? 'bg-[#101826] border-[#1E314A]' : 'bg-gray3 border-transparent'}`}>
            <div className="text-[20px] mb-1">{s.emoji}</div>
            <div className={`text-[17px] font-black ${isDark ? 'text-white' : 'text-text'}`}>{s.value}</div>
            <div className={`text-[9px] font-bold uppercase tracking-wide mt-[2px] ${isDark ? 'text-[#50728D]' : 'text-text-light'}`}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Continue Learning */}
      <button
        onClick={() => onStartLesson(currentAyah)}
        className="cta-btn mb-3 w-full"
      >
        ▶ Continue Learning · {currentAyah}
      </button>

      {/* Rooms & Competitions Banner */}
      <button
        onClick={onNavigateToRooms}
        className={`w-full p-4 mb-3 border-2 rounded-[var(--radius-card)] text-left flex items-center justify-between transition-all duration-300 ${
          isDark 
            ? 'bg-[#152336] border-[#1E314A] hover:border-[#60E0C1]' 
            : 'bg-white border-gray2 hover:border-blue'
        }`}
      >
        <div>
          <div className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-[#60E0C1]' : 'text-blue'}`}>
            🏆 Group Competitions
          </div>
          <div className={`text-[14px] font-black mt-0.5 ${isDark ? 'text-white' : 'text-text'}`}>
            Rooms & Leaderboards
          </div>
          <div className={`text-[11px] font-bold mt-1 ${isDark ? 'text-[#A1B2C3]' : 'text-text-light'}`}>
            Compete with friends using your QF sync score!
          </div>
        </div>
        <div className="text-[28px] mr-1">🏅</div>
      </button>

      {/* Due for Review Card or Loading Skeleton */}
      {isLoading ? (
        <div className={`w-full p-4 mb-3 border-2 rounded-[var(--radius-card)] text-left flex items-center justify-between transition-all duration-300 animate-pulse ${isDark ? 'bg-[#152336] border-[#1E314A]' : 'bg-white border-gray2'}`}>
          <div>
            <div className={`h-3 w-24 rounded-full mb-2 ${isDark ? 'bg-[#1E314A]' : 'bg-gray3'}`}></div>
            <div className={`h-4 w-32 rounded-full mb-2 ${isDark ? 'bg-[#1E314A]' : 'bg-gray3'}`}></div>
            <div className={`h-3 w-48 rounded-full ${isDark ? 'bg-[#1E314A]' : 'bg-gray3'}`}></div>
          </div>
          <div className={`h-8 w-8 rounded-full ${isDark ? 'bg-[#1E314A]' : 'bg-gray3'}`}></div>
        </div>
      ) : learnedCount > 0 ? (
        dueCards.length > 0 ? (
          <div
            className={`w-full p-4 mb-3 border-2 rounded-[var(--radius-card)] text-left flex flex-col gap-3 transition-all duration-300 ${
              isDark 
                ? 'bg-[#152336] border-[#1E314A]' 
                : 'bg-white border-gray2'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-[15px] font-black ${isDark ? 'text-white' : 'text-text'}`}>
                  {dueCards.length} {dueCards.length === 1 ? "card is" : "cards are"} due for review
                </div>
                <div className={`text-[12px] font-bold mt-0.5 ${isDark ? 'text-[#A1B2C3]' : 'text-text-light'}`}>
                  Review now to lock these roots into your long-term memory!
                </div>
              </div>
              <div className="text-[28px] mr-1 animate-pulse">🧠</div>
            </div>
            <button onClick={onStartReview} className="cta-btn secondary w-full border-2 text-[14px] py-3 uppercase tracking-wider">
              Review Now →
            </button>
          </div>
        ) : (
          <div
            className={`w-full p-4 mb-3 border-2 rounded-[var(--radius-card)] text-left flex items-center justify-between transition-all duration-300 ${
              isDark 
                ? 'bg-[#101F18] border-[#1B3627]' 
                : 'bg-[#EBFDF3] border-[#C2F4D8]'
            }`}
          >
            <div>
              <div className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-[#60E0C1]' : 'text-green-dark'}`}>
                🎉 SRS Caught Up
              </div>
              <div className={`text-[14px] font-black mt-0.5 ${isDark ? 'text-white' : 'text-text'}`}>
                All Caught Up!
              </div>
              <div className={`text-[11px] font-bold mt-1 ${isDark ? 'text-[#A1B2C3]' : 'text-text-light'}`}>
                No words are currently due for review. Excellent work!
              </div>
            </div>
            <div className="text-[28px] mr-1">🏆</div>
          </div>
        )
      ) : null}

      {/* Level Modal */}
      {showLevelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in" onClick={() => setShowLevelModal(false)}>
          <div 
            className={`w-full max-w-md rounded-[24px] overflow-hidden shadow-xl animate-slide-up ${isDark ? 'bg-[#101826]' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-4 border-b-2 flex justify-between items-center ${isDark ? 'border-[#1E314A] bg-[#152336]' : 'border-gray2 bg-gray3'}`}>
              <h2 className="text-[16px] font-black uppercase tracking-wide">QuranLingo's Levels</h2>
              <button onClick={() => setShowLevelModal(false)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-opacity ${isDark ? 'bg-[#1E314A] text-white' : 'bg-gray2 text-gray1 hover:opacity-80'}`}>✕</button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <div className="flex flex-col gap-2">
                {LEVELS.map((level, idx) => {
                  const nextLevel = LEVELS[idx + 1];
                  const rangeText = nextLevel ? `${level.minAyahs} – ${nextLevel.minAyahs - 1}` : `${level.minAyahs} – 6236`;
                  const isCurrent = lv.name === level.name;
                  
                  return (
                    <div key={level.name} className={`p-3 rounded-xl border-2 flex items-center gap-3 ${isCurrent ? (isDark ? 'bg-[#152336] border-[#60E0C1]' : 'bg-blue-light border-blue') : (isDark ? 'bg-transparent border-[#1E314A]' : 'bg-transparent border-gray2')}`}>
                      <div className="text-[28px]">{level.emoji}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[15px] font-black ${isDark ? 'text-white' : 'text-text'}`}>{level.name}</span>
                          {isCurrent && <span className="text-[9px] font-bold uppercase tracking-wider bg-gold text-white px-1.5 py-0.5 rounded-full">Current</span>}
                        </div>
                        <div className={`text-[12px] font-bold ${isDark ? 'text-[#60E0C1]' : 'text-blue'}`}>{rangeText} Ayahs</div>
                        <div className={`text-[11px] leading-tight mt-0.5 ${isDark ? 'text-[#A1B2C3]' : 'text-text-light'}`}>{level.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && learnedCount === 0 && (
        <div className="text-center py-6">
          <div className="text-[36px] mb-2">🌱</div>
          <p className="text-[13px] text-text-light">Start your first lesson to begin learning Quranic vocabulary!</p>
        </div>
      )}
    </div>
  );
}
