"use client";

import { useState, useCallback, useEffect } from "react";
import { T } from "@/lib/i18n";
import { getStorageProvider } from "@/lib/storage";
import type { ReviewCard } from "@/lib/storage/interface";

interface ReviewScreenProps {
  storageMode: "guest" | "cloud";
  onGoHome: () => void;
  onLoseHeart: () => void;
  limit: number;
}

export default function ReviewScreen({ storageMode, onGoHome, onLoseHeart, limit }: ReviewScreenProps) {
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
    <div className="flex-1 overflow-y-auto p-3.5">
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-[8px] bg-gray2 rounded-full overflow-hidden">
          <div className="h-full bg-green rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[11px] font-bold text-text-light">{idx + 1} / {total}</span>
      </div>

      {/* Flashcard */}
      <div
        onClick={flip}
        className="cursor-pointer bg-white border-2 border-gray2 rounded-[var(--radius-card)] overflow-hidden mb-3 transition-all duration-300"
        style={{ minHeight: "280px" }}
      >
        {!flipped ? (
          /* Front */
          <div className="p-5 text-center flex flex-col items-center justify-center min-h-[280px]">
            <div className="text-[10px] font-bold text-text-light mb-4 uppercase">{T("recallMeaning")}</div>
            <div className="text-[36px] font-amiri text-text mb-2">{card.arabic}</div>
            <div className="text-[11px] text-text-light">{card.ayah}</div>
            <div className="text-[10px] text-gray1 mt-1">{card.ref}</div>
            <div className="text-[10px] text-gray1 mt-4 animate-pulse-load">{T("tapToReveal")}</div>
          </div>
        ) : (
          /* Back */
          <div className="p-4 flex flex-col items-center min-h-[280px] animate-fade-in overflow-y-auto">
            {/* Word + Meaning */}
            <div className="text-[22px] font-amiri text-text mb-1">{card.arabic}</div>
            <div className="text-[16px] font-black text-green-dark mb-2">{card.meaning}</div>
            <span className="pill pill-review mb-3">{card.root}</span>

            {/* Ayah Context — Arabic with highlighted word */}
            {card.ayahWords.length > 0 && (
              <div className="w-full bg-gray3 rounded-[var(--radius-sm)] p-3 mt-1 mb-2">
                <div className="text-[9px] font-bold text-text-light uppercase mb-2 text-center">
                  📖 Ayah {card.ref}
                </div>

                {/* Word-by-word translation with target highlighted */}
                <div className="flex flex-wrap gap-1 justify-center mb-2">
                  {card.ayahWords.map((w, i) => {
                    const isTarget = w.arabic === card.arabic || 
                      w.arabic.replace(/[\u064B-\u065F\u0670]/g, "") === card.arabic.replace(/[\u064B-\u065F\u0670]/g, "");
                    return (
                      <div key={i} className={`text-center px-1.5 py-1 rounded ${isTarget ? "bg-green-light" : ""}`}>
                        <div className={`text-[12px] font-amiri ${isTarget ? "text-green-dark font-bold" : "text-text"}`}>{w.arabic}</div>
                        <div className={`text-[8px] ${isTarget ? "text-green-dark font-bold" : "text-text-light"}`}>{w.translation}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Full English translation */}
                {card.ayahTranslation && (
                  <div className="border-t border-gray2 pt-2 mt-1">
                    <div className="text-[11px] text-text leading-relaxed italic text-center">
                      "{card.ayahTranslation}"
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Fallback if no ayah words available */}
            {card.ayahWords.length === 0 && card.ayah && (
              <div className="w-full bg-gray3 rounded-[var(--radius-sm)] p-2.5 mt-1">
                <div className="text-[14px] font-amiri text-text text-right" dir="rtl">{card.ayah}</div>
                <div className="text-[10px] text-gray1 mt-1 text-center">{card.ref}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Show Answer / Confidence buttons */}
      {!flipped ? (
        <button onClick={flip} className="cta-btn">{T("showAnswer")}</button>
      ) : (
        <>
          <div className="text-center text-[11px] font-bold text-text-light mb-2">{T("howWell")}</div>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { key: "again" as const, emoji: "🔁", label: T("again"), color: "bg-red text-white", interval: "< 1 min" },
              { key: "hard" as const, emoji: "😓", label: T("hard"), color: "bg-orange text-white", interval: "~10 min" },
              { key: "good" as const, emoji: "✓", label: T("good"), color: "bg-green text-white", interval: "1 day" },
              { key: "easy" as const, emoji: "★", label: T("easy"), color: "bg-blue text-white", interval: "4 days" },
            ].map((btn) => (
              <button
                key={btn.key}
                onClick={() => rate(btn.key)}
                className={`${btn.color} rounded-[var(--radius-sm)] py-2.5 px-1 text-center cursor-pointer border-none font-['DM_Sans'] transition-transform active:scale-95`}
              >
                <div className="text-[16px] mb-0.5">{btn.emoji}</div>
                <div className="text-[11px] font-extrabold">{btn.label}</div>
                <div className="text-[8px] opacity-70 mt-0.5">{btn.interval}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
