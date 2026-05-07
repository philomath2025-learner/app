"use client";

import { useState, useEffect } from "react";
import { getLevel, getNextLevel } from "@/lib/constants";
import { getStorageProvider } from "@/lib/storage";
import type { ReviewCard } from "@/lib/storage/interface";

interface HomeScreenProps {
  xp: number;
  currentAyah: string;
  storageMode: "guest" | "cloud";
  onStartReview: () => void;
  onStartLesson: (ref: string) => void;
}

export default function HomeScreen({ xp, currentAyah, storageMode, onStartReview, onStartLesson }: HomeScreenProps) {
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

      // Get due reviews for the preview cards
      const due = await provider.getDueReviews(3);
      setDueCards(due);
    }
    loadHomeData();
  }, [storageMode]);

  // Format current ayah for display
  const [surahNum] = currentAyah.split(":");
  const surahInt = parseInt(surahNum, 10);

  return (
    <div className="flex-1 overflow-y-auto p-3.5">
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
      <div className="bg-white border-2 border-gray2 rounded-[var(--radius-card)] p-3 mb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[12px] font-extrabold text-text">Daily Goal</span>
          <span className="text-[12px] font-bold text-green-dark">{learnedCount > 0 ? `${Math.min(100, Math.round((learnedCount / 50) * 100))}%` : "0%"}</span>
        </div>
        <div className="flex gap-1">
          {[10, 20, 30, 40, 50].map((threshold, i) => (
            <div key={i} className={`flex-1 h-[9px] rounded-full transition-colors ${learnedCount >= threshold ? "bg-green" : "bg-gray2"}`} />
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { emoji: "📚", value: String(learnedCount), label: "Learned" },
          { emoji: "⚡", value: String(xp), label: "Total XP" },
          { emoji: "📖", value: currentAyah, label: "Current" },
        ].map((s) => (
          <div key={s.label} className="bg-gray3 rounded-[var(--radius-sm)] p-3 text-center">
            <div className="text-[20px] mb-1">{s.emoji}</div>
            <div className="text-[17px] font-black text-text">{s.value}</div>
            <div className="text-[9px] font-bold text-text-light uppercase tracking-wide mt-[2px]">{s.label}</div>
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
          <div className="section-header">Due for review</div>
          {dueCards.map((card) => (
            <button
              key={card.id}
              onClick={onStartReview}
              className="w-full bg-white border-2 border-gray2 rounded-[var(--radius-sm)] p-3 mb-[7px] flex items-center justify-between cursor-pointer hover:border-blue transition-colors text-left"
            >
              <div>
                <div className="text-[19px] text-text font-amiri">{card.arabic}</div>
                <div className="text-[10px] text-text-light font-semibold mt-[1px]">{card.root} · {card.meaning}</div>
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
