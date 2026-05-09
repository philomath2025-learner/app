"use client";

import { useState, useEffect, useMemo } from "react";
import { getStorageProvider } from "@/lib/storage";
import { VocabularyLedgerEntry } from "@/lib/storage/interface";

interface LedgerScreenProps {
  storageMode: "guest" | "cloud";
  theme: "light" | "dark";
}

export default function LedgerScreen({ storageMode, theme }: LedgerScreenProps) {
  const [ledger, setLedger] = useState<VocabularyLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const isDark = theme === "dark";

  useEffect(() => {
    async function loadLedger() {
      setLoading(true);
      try {
        const provider = getStorageProvider(storageMode);
        await provider.init();
        const rootsMap = await provider.getKnownRoots();
        
        // Convert map to array and sort by learned_at (newest first)
        const rootsArray = Array.from(rootsMap.values()).sort((a, b) => 
          new Date(b.learned_at).getTime() - new Date(a.learned_at).getTime()
        );
        
        setLedger(rootsArray);
      } catch (err) {
        console.error("Failed to load ledger:", err);
      } finally {
        setLoading(false);
      }
    }
    loadLedger();
  }, [storageMode]);

  const filteredLedger = useMemo(() => {
    if (!searchQuery.trim()) return ledger;
    const query = searchQuery.toLowerCase();
    return ledger.filter(
      (entry) =>
        entry.root?.toLowerCase().includes(query) ||
        entry.lemma?.toLowerCase().includes(query) ||
        entry.first_surface_form?.toLowerCase().includes(query) ||
        entry.first_ayah_key?.includes(query) ||
        entry.translation_en?.toLowerCase().includes(query)
    );
  }, [ledger, searchQuery]);

  // Helper: SRS level label
  function getLevelInfo(interval: number | undefined) {
    const i = interval || 1;
    if (i <= 1) return { label: "New", color: "text-blue", emoji: "🌱" };
    if (i <= 6) return { label: "Learning", color: "text-orange", emoji: "📖" };
    if (i <= 15) return { label: "Familiar", color: "text-purple", emoji: "🧠" };
    if (i <= 30) return { label: "Known", color: "text-green-dark", emoji: "✅" };
    return { label: "Mastered", color: "text-gold-dark", emoji: "🏆" };
  }

  return (
    <div className={`flex flex-col flex-1 overflow-hidden ${isDark ? 'bg-[#0B1121]' : 'bg-[#F0F4F8]'}`}>
      {/* Header & Search */}
      <div className={`p-4 pt-6 pb-4 border-b-2 z-10 sticky top-0 ${isDark ? 'bg-[#0B1121] border-[#1E314A]' : 'bg-white border-gray2'}`}>
        <h2 className={`text-[22px] font-black tracking-tight mb-3 ${isDark ? 'text-white' : 'text-text'}`}>
          Vocabulary Ledger
        </h2>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className={`h-5 w-5 ${isDark ? 'text-[#A1B2C3]' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className={`w-full pl-10 pr-4 py-3 rounded-2xl text-[15px] font-medium transition-colors outline-none border-2 focus:border-blue ${
              isDark 
                ? 'bg-[#152336] border-[#1E314A] text-white placeholder-[#50728D]' 
                : 'bg-gray3 border-transparent text-text placeholder-gray1'
            }`}
            placeholder="Search roots, words, or ayah..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
          </div>
        ) : filteredLedger.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-[48px] mb-4">🏜️</div>
            <h3 className={`text-[18px] font-black mb-2 ${isDark ? 'text-white' : 'text-text'}`}>No roots found</h3>
            <p className={`text-[14px] ${isDark ? 'text-[#A1B2C3]' : 'text-text-light'}`}>
              {searchQuery ? "Try a different search term." : "Start learning to build your dictionary!"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-6">
            <div className={`text-[12px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-[#50728D]' : 'text-gray1'}`}>
              {filteredLedger.length} Roots Known
            </div>
            {filteredLedger.map((entry) => {
              // Calculate days until next review
              const nextReviewDate = new Date(entry.srs_next_review || entry.next_review || new Date().toISOString());
              const daysUntil = Math.ceil((nextReviewDate.getTime() - Date.now()) / (1000 * 3600 * 24));
              
              let reviewText = "";
              let reviewColor = "";
              
              if (daysUntil <= 0) {
                reviewText = "Review Now";
                reviewColor = isDark ? "bg-[#3D1A1A] text-[#FF6B6B]" : "bg-red-light text-red-dark";
              } else if (daysUntil === 1) {
                reviewText = "Due Tomorrow";
                reviewColor = isDark ? "bg-[#3D2E1A] text-[#FFB84D]" : "bg-orange-light text-orange-dark";
              } else {
                reviewText = `Due in ${daysUntil}d`;
                reviewColor = isDark ? "bg-[#1A3D24] text-[#4DFF88]" : "bg-green-light text-green-dark";
              }

              const srsInterval = entry.srs_interval || entry.interval || 1;
              const levelInfo = getLevelInfo(srsInterval);
              const firstAyah = entry.first_ayah_key || entry.first_seen_ayah || "";

              return (
                <div key={entry.root} className={`rounded-[20px] p-4 border-2 transition-all hover:-translate-y-1 ${
                  isDark ? 'bg-[#152336] border-[#1E314A] shadow-md' : 'bg-white border-gray2 shadow-sm'
                }`}>
                  {/* Top row: Root + Due badge */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                      <span className={`text-[28px] font-quran font-bold leading-none mb-0.5 ${isDark ? 'text-[#60E0C1]' : 'text-blue-dark'}`}>
                        {entry.root || entry.lemma}
                      </span>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${reviewColor}`}>
                        {reviewText}
                      </span>
                    </div>
                  </div>

                  {/* Surface form bubble */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {entry.first_surface_form && (
                      <span className={`inline-block text-[16px] font-quran px-3 py-1 rounded-full border-2 ${
                        isDark ? 'bg-[#1A3D24] border-[#2D5A3A] text-[#60E0C1]' : 'bg-green-light border-green text-green-dark'
                      }`}>
                        {entry.first_surface_form}
                      </span>
                    )}
                    {entry.lemma && entry.lemma !== entry.first_surface_form && (
                      <span className={`inline-block text-[16px] font-quran px-3 py-1 rounded-full border-2 ${
                        isDark ? 'bg-[#1A2D4D] border-[#2D4A6A] text-[#7AC0FF]' : 'bg-blue-light border-blue text-blue-dark'
                      }`}>
                        {entry.lemma}
                      </span>
                    )}
                  </div>

                  {/* Meaning */}
                  {entry.translation_en && (
                    <div className={`text-[13px] font-semibold mb-2 ${isDark ? 'text-white' : 'text-text'}`}>
                      {entry.translation_en}
                    </div>
                  )}

                  {/* Bottom meta row */}
                  <div className={`flex flex-wrap items-center gap-1.5 text-[11px] font-bold ${isDark ? 'text-[#A1B2C3]' : 'text-text-light'}`}>
                    <span className={`px-2 py-0.5 rounded-md ${isDark ? 'bg-[#202E45]' : 'bg-gray3'}`}>
                      {entry.pos}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md ${isDark ? 'bg-[#202E45]' : 'bg-gray3'}`}>
                      First at {firstAyah}
                    </span>
                    {entry.frequency_root && entry.frequency_root > 0 && (
                      <span className={`px-2 py-0.5 rounded-md ${isDark ? 'bg-[#202E45]' : 'bg-gray3'}`}>
                        🔁 {entry.frequency_root} occ.
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-md flex items-center gap-1 ${isDark ? 'bg-[#202E45]' : 'bg-gray3'}`}>
                      {levelInfo.emoji} {levelInfo.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
