"use client";

import { useState, useCallback, useEffect } from "react";
import { T } from "@/lib/i18n";
import { getStorageProvider } from "@/lib/storage";
import type { ReviewCard } from "@/lib/storage/interface";

interface ReviewScreenProps {
  storageMode: "guest" | "cloud";
  theme: "light" | "dark";
  onGoHome: () => void;
  onLoseHeart: () => void;
  limit: number;
}

export default function ReviewScreen({ storageMode, theme, onGoHome, onLoseHeart, limit }: ReviewScreenProps) {
  const isDark = theme === "dark";
  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [done, setDone] = useState(false);
  const [mistakeTracker, setMistakeTracker] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadDueReviews() {
      const provider = getStorageProvider(storageMode);
      const due = await provider.getDueReviews(limit);
      setCards(due);
      setLoading(false);
    }
    loadDueReviews();
  }, [storageMode, limit]);

  const total = cards.length;
  const pct = done || total === 0 ? 100 : Math.round((idx / total) * 100);

  const flip = useCallback(() => {
    if (!flipped) setFlipped(true);
  }, [flipped]);

  const rate = useCallback(
    async (rating: "again" | "hard" | "good" | "easy") => {
      const card = cards[idx];
      if (!card) return;
      
      if (rating === "good" || rating === "easy") {
        setCorrect((c) => c + 1);
        setMistakeTracker(prev => ({ ...prev, [card.id]: 0 }));
      }

      if (rating === "again") {
        setWrong((w) => w + 1);
        const currentMistakes = (mistakeTracker[card.id] || 0) + 1;
        setMistakeTracker(prev => ({ ...prev, [card.id]: currentMistakes }));

        if (currentMistakes >= 3) {
          onLoseHeart();
          setMistakeTracker(prev => ({ ...prev, [card.id]: 0 }));
        }

        const updatedCards = [...cards];
        const nextPos = Math.min(idx + 4, updatedCards.length);
        updatedCards.splice(nextPos, 0, card);
        setCards(updatedCards);
      }

      const provider = getStorageProvider(storageMode);
      provider.submitReview(card.id, rating).catch(e => console.error("Failed to submit review", e));

      if (idx + 1 >= cards.length) {
        setDone(true);
      } else {
        setIdx((i) => i + 1);
        setFlipped(false);
      }
    },
    [idx, cards, storageMode, mistakeTracker, onLoseHeart]
  );

  if (loading) {
    return <div className="flex-1 flex items-center justify-center p-3.5 animate-pulse-load">Loading your reviews...</div>;
  }

  if (total === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-3.5">
        <div className="text-center py-20">
          <div className="text-[48px] mb-4">🏆</div>
          <h2 className="text-[18px] font-black text-text mb-2">You're all caught up!</h2>
          <p className="text-[13px] text-text-light mb-6">No words are due for review right now. Keep learning new words or come back later!</p>
          <button onClick={onGoHome} className="cta-btn mt-6 max-w-[200px] mx-auto">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex-1 overflow-y-auto p-3.5">
        <div className="text-center py-8">
          <div className="text-[52px] mb-2 animate-pop-in">🎉</div>
          <h2 className="text-[20px] font-black text-text mb-1">{T("reviewComplete")}</h2>
          <p className="text-[13px] text-text-light mb-4">{correct} of {total} cards rated Good or Easy</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { emoji: "⚡", value: `${correct * 10}`, label: T("xpEarned") },
              { emoji: "✅", value: `${correct}`, label: "Good / Easy" },
              { emoji: "🔥", value: "12", label: T("dayStreak") },
            ].map((s) => (
              <div key={s.label} className="bg-gray3 rounded-[var(--radius-sm)] p-3 text-center">
                <div className="text-[18px] mb-1">{s.emoji}</div>
                <div className="text-[17px] font-black text-text">{s.value}</div>
                <div className="text-[9px] font-bold text-text-light uppercase">{s.label}</div>
              </div>
            ))}
          </div>
          <button onClick={onGoHome} className="cta-btn mb-2">{T("backHome")}</button>
        </div>
      </div>
    );
  }

  const card = cards[idx];

  return (
    <div className={`flex-1 flex flex-col overflow-hidden h-full transition-colors duration-300 ${isDark ? 'bg-[#0B1121]' : ''}`}>
      {/* Scrollable Main Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-4 shrink-0">
          <div className={`flex-1 h-2.5 rounded-full overflow-hidden shadow-inner ${isDark ? 'bg-[#1E314A]' : 'bg-gray2'}`}>
            <div className="h-full bg-green rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
          </div>
          <span className={`text-[12px] font-black tabular-nums ${isDark ? 'text-[#50728D]' : 'text-text-light'}`}>{idx + 1} / {total}</span>
        </div>

        {/* Flashcard Container */}
        <div
          onClick={flip}
          className={`flex-1 flex flex-col border-2 rounded-[32px] overflow-hidden shadow-sm transition-all duration-300 relative ${isDark ? 'bg-[#152336] border-[#1E314A]' : 'bg-white border-gray2'} ${!flipped ? 'hover:border-blue/30' : ''}`}
          style={{ minHeight: "380px" }}
        >
          {!flipped ? (
            /* Front Side */
            <div className="flex-1 flex flex-col p-6 overflow-y-auto custom-scrollbar">
              <div className={`text-[11px] font-black mb-6 uppercase tracking-widest text-center shrink-0 ${isDark ? 'text-[#50728D]' : 'text-text-light'}`}>
                {T("recallMeaning")}
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center py-4">
                <div className={`px-6 py-4 rounded-2xl border-2 mb-8 shadow-sm transition-colors ${isDark ? 'bg-[#101826] border-[#284155]' : 'bg-blue-light/30 border-blue/10'}`}>
                  <div className={`text-[10px] font-black uppercase tracking-widest mb-1 text-center ${isDark ? 'text-[#60E0C1]' : 'text-blue-dark'}`}>Recall Meaning</div>
                  <div className={`text-[48px] font-naskh leading-none ${isDark ? 'text-white' : 'text-text'}`}>{card.arabic}</div>
                </div>

                <div className={`text-[14px] mb-3 font-bold tracking-tight uppercase ${isDark ? 'text-[#50728D]' : 'text-gray1'}`}>{card.ref}</div>
                
                <div className="w-full text-center px-2" dir="rtl">
                  <div className={`text-[32px] sm:text-[38px] font-naskh leading-[1.6] opacity-90 ${isDark ? 'text-white' : 'text-text'}`}>
                    {card.ayah}
                  </div>
                </div>
              </div>

              <div className={`text-[11px] font-bold text-center mt-auto py-2 animate-pulse uppercase tracking-wider ${isDark ? 'text-[#50728D]' : 'text-gray1'}`}>
                {T("tapToReveal")}
              </div>
            </div>
          ) : (
            /* Back Side */
            <div className="flex-1 flex flex-col p-6 overflow-y-auto custom-scrollbar animate-fade-in">
              <div className="flex flex-col items-center mb-6 shrink-0">
                <div className={`text-[48px] font-naskh leading-tight mb-2 ${isDark ? 'text-white' : 'text-text'}`}>{card.arabic}</div>
                <div className={`text-[24px] font-black mb-3 px-4 py-1 rounded-xl transition-colors ${isDark ? 'bg-[#202E45] text-[#60E0C1]' : 'bg-green-light/50 text-green-dark'}`}>
                  {card.meaning}
                </div>
                <span className={`px-4 py-1.5 rounded-full text-[12px] font-black uppercase tracking-wider transition-colors ${isDark ? 'bg-[#101826] text-[#A1B2C3]' : 'bg-blue-light text-blue-dark'}`}>
                  Root: {card.root}
                </span>
              </div>

              {/* Ayah Context */}
              {card.ayahWords.length > 0 ? (
                <div className={`w-full rounded-[24px] p-5 border mb-4 transition-colors ${isDark ? 'bg-[#101826] border-[#1E314A]' : 'bg-gray3/80 border-gray2/50'}`}>
                  <div className={`flex justify-between items-center mb-4 border-b pb-3 ${isDark ? 'border-[#1E314A]' : 'border-gray2/30'}`}>
                    <div className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-[#50728D]' : 'text-text-light'}`}>Contextual Usage</div>
                    <div className={`text-[10px] font-black px-2 py-0.5 rounded ${isDark ? 'bg-[#202E45] text-[#60E0C1]' : 'bg-blue-light text-blue-dark'}`}>{card.ref}</div>
                  </div>

                  {/* Word-by-word with highlight */}
                  <div className="flex flex-wrap gap-2 justify-center mb-6" dir="rtl">
                    {card.ayahWords.map((w, i) => {
                      const isTarget = w.arabic === card.arabic || 
                        w.arabic.replace(/[\u064B-\u065F\u0670]/g, "") === card.arabic.replace(/[\u064B-\u065F\u0670]/g, "");
                      return (
                        <div key={i} className={`text-center px-2 py-1.5 rounded-xl transition-all ${isTarget ? (isDark ? "bg-[#202E45] shadow-lg border-2 border-[#60E0C1]/30 scale-110 z-10" : "bg-white shadow-md border-2 border-green/30 scale-110 z-10") : "opacity-60"}`}>
                          <div className={`text-[18px] font-naskh ${isTarget ? (isDark ? "text-[#60E0C1] font-bold" : "text-green-dark font-bold") : (isDark ? "text-white" : "text-text")}`}>{w.arabic}</div>
                          <div className={`text-[10px] font-bold ${isTarget ? (isDark ? "text-[#60E0C1]" : "text-green-dark") : (isDark ? "text-[#50728D]" : "text-text-light")}`}>{w.translation}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Semantic Translation */}
                  {card.ayahTranslation && (
                    <div className={`p-4 rounded-xl italic text-[14px] leading-relaxed text-center border transition-colors ${isDark ? 'bg-[#152336] text-[#A1B2C3] border-[#1E314A]' : 'bg-white/50 text-text border-gray2/30'}`}>
                      "{card.ayahTranslation}"
                    </div>
                  )}
                </div>
              ) : (
                 /* Fallback for simple card */
                 card.ayah && (
                   <div className={`w-full rounded-[24px] p-6 border mb-4 transition-colors ${isDark ? 'bg-[#101826] border-[#1E314A]' : 'bg-gray3/80 border-gray2/50'}`}>
                     <div className={`text-[24px] font-naskh leading-relaxed text-right mb-4 ${isDark ? 'text-white' : 'text-text'}`} dir="rtl">
                       {card.ayah}
                     </div>
                     <div className={`text-[12px] font-bold text-center border-t pt-3 italic transition-colors ${isDark ? 'text-[#50728D] border-[#1E314A]' : 'text-text-light border-gray2/30'}`}>
                       "{card.ayahTranslation || 'No translation available'}"
                     </div>
                   </div>
                 )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fixed Footer Buttons */}
      <div className={`p-4 border-t-2 transition-colors duration-300 z-20 ${isDark ? 'bg-[#0B1121] border-[#1E314A]' : 'bg-white border-gray2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'}`}>
        {!flipped ? (
          <button 
            onClick={flip} 
            className="w-full bg-green hover:bg-green-dark text-white rounded-2xl py-4 px-6 text-[16px] font-black uppercase tracking-widest border-b-4 border-green-dark shadow-lg active:translate-y-1 active:border-b-0 transition-all"
          >
            {T("showAnswer")}
          </button>
        ) : (
          <div className="animate-fade-in">
            <div className={`text-center text-[12px] font-black mb-4 uppercase tracking-widest flex items-center justify-center gap-2 ${isDark ? 'text-[#50728D]' : 'text-text-light'}`}>
              <span className={`h-px w-8 ${isDark ? 'bg-[#1E314A]' : 'bg-gray2'}`}></span>
              {T("howWell")}
              <span className={`h-px w-8 ${isDark ? 'bg-[#1E314A]' : 'bg-gray2'}`}></span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: "again" as const, emoji: "🔁", label: T("again"), color: "bg-red border-red-900 shadow-[0_4px_0_#991B1B]", interval: "< 1m" },
                { key: "hard" as const, emoji: "😓", label: T("hard"), color: "bg-orange border-orange-900 shadow-[0_4px_0_#9A3412]", interval: "10m" },
                { key: "good" as const, emoji: "✓", label: T("good"), color: "bg-green border-green-900 shadow-[0_4px_0_#166534]", interval: "1d" },
                { key: "easy" as const, emoji: "★", label: T("easy"), color: "bg-blue border-blue-900 shadow-[0_4px_0_#075985]", interval: "4d" },
              ].map((btn) => (
                <button
                  key={btn.key}
                  onClick={() => rate(btn.key)}
                  className={`flex flex-col items-center justify-center ${btn.color} text-white rounded-2xl pt-2.5 pb-2 px-1 border-b-4 active:border-b-0 active:translate-y-1 transition-all`}
                >
                  <div className="text-[20px] mb-0.5 leading-none">{btn.emoji}</div>
                  <div className="text-[10px] font-black uppercase tracking-tight">{btn.label}</div>
                  <div className="text-[9px] font-bold opacity-80 mt-0.5">{btn.interval}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
