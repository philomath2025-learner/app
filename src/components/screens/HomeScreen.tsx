"use client";

import { useState, useEffect } from "react";
import { getLevel, getNextLevel } from "@/lib/constants";
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
}

export default function HomeScreen({ xp, dailyXp, targetXp, streak, currentAyah, storageMode, theme, onStartReview, onStartLesson }: HomeScreenProps) {
  const isDark = theme === "dark";
  const lv = getLevel(xp);
  const nx = getNextLevel(xp);
  const xpToNext = nx ? nx.minXP - xp : 0;

  const [learnedCount, setLearnedCount] = useState(0);
  const [dueCards, setDueCards] = useState<ReviewCard[]>([]);

  useEffect(() => {
    async function loadHomeData() {
      const provider = getStorageProvider(storageMode);
      
      // Get vocabulary count from known roots
      const knownRoots = await provider.getKnownRoots();
      setLearnedCount(knownRoots.size);

      // Get user preferences for review limit
      const prefs = await provider.getLocalPreferences();
      const reviewLimit = prefs.reviewLimit || 20;

      // Get due reviews for the preview cards based on preferred limit
      const due = await provider.getDueReviews(reviewLimit);
      setDueCards(due);
    }
    loadHomeData();
  }, [storageMode]);

  // Format current ayah for display
  const [surahNum] = currentAyah.split(":");
  
  const pct = targetXp > 0 ? Math.min(100, Math.round((dailyXp / targetXp) * 100)) : 0;

  return (
    <div className={`flex-1 overflow-y-auto p-4 transition-colors duration-300 ${isDark ? 'bg-[#0B1121]' : 'bg-[#F0F4F8]'}`}>
      {/* Level Banner */}
      <div className="bg-gradient-to-br from-blue to-purple rounded-[var(--radius-card)] p-4 mb-3 flex items-center justify-between text-white">
        <div>
          <div className="text-[10px] font-bold opacity-80 uppercase tracking-wide mb-[2px]">Current level</div>
          <div className="text-[19px] font-black">{lv.name}</div>
          <div className="text-[11px] opacity-75 mt-[2px]">
            {nx ? `${xpToNext} XP to ${nx.name}` : "Max level!"}
          </div>
        </div>
        <div className="text-[34px] w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">{lv.emoji}</div>
      </div>

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

      {/* Due for Review */}
      {dueCards.length > 0 && (
        <>
          <div className={`section-header ${isDark ? 'text-[#50728D]' : ''}`}>Due for review</div>
          {dueCards.map((card) => (
            <button
              key={card.id}
              onClick={onStartReview}
              className={`w-full border-2 rounded-[var(--radius-sm)] p-4 mb-[7px] flex items-center justify-between cursor-pointer transition-all text-left ${isDark ? 'bg-[#152336] border-[#1E314A] hover:border-blue' : 'bg-white border-gray2 hover:border-blue'}`}
            >
              <div>
                <div className={`text-[20px] font-quran ${isDark ? 'text-white' : 'text-text'}`}>{card.arabic}</div>
                <div className={`text-[10px] font-bold mt-[2px] ${isDark ? 'text-[#50728D]' : 'text-text-light'}`}>{card.root} · {card.meaning}</div>
              </div>
              <span className="pill pill-review">review</span>
            </button>
          ))}
        </>
      )}

      {/* Empty state */}
      {learnedCount === 0 && (
        <div className="text-center py-6">
          <div className="text-[36px] mb-2">🌱</div>
          <p className="text-[13px] text-text-light">Start your first lesson to begin learning Quranic vocabulary!</p>
        </div>
      )}
    </div>
  );
}
