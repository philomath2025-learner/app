"use client";

import { useState, useEffect, useMemo } from "react";
import { getStorageProvider } from "@/lib/storage";
import { VocabularyLedgerEntry, VocabularyDecision, ReviewCard } from "@/lib/storage/interface";

interface LedgerScreenProps {
  storageMode: "guest" | "cloud";
  theme: "light" | "dark";
}

export default function LedgerScreen({ storageMode, theme }: LedgerScreenProps) {
  const [ledger, setLedger] = useState<VocabularyLedgerEntry[]>([]);
  const [decisions, setDecisions] = useState<VocabularyDecision[]>([]);
  const [dueReviews, setDueReviews] = useState<ReviewCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"roots" | "audit" | "review">("roots");

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

        const loadedDecisions = await provider.getDecisions();
        setDecisions(loadedDecisions);

        const loadedReviews = await provider.getDueReviews(100); // Fetch up to 100 due reviews for the list
        setDueReviews(loadedReviews);
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

  const filteredDecisions = useMemo(() => {
    if (!searchQuery.trim()) return decisions;
    const query = searchQuery.toLowerCase();
    return decisions.filter(
      (entry) =>
        entry.root?.toLowerCase().includes(query) ||
        entry.arabic?.toLowerCase().includes(query) ||
        entry.ayah_key?.includes(query) ||
        entry.reason?.toLowerCase().includes(query)
    );
  }, [decisions, searchQuery]);

  const filteredReviews = useMemo(() => {
    if (!searchQuery.trim()) return dueReviews;
    const query = searchQuery.toLowerCase();
    return dueReviews.filter(
      (entry) =>
        entry.root?.toLowerCase().includes(query) ||
        entry.arabic?.toLowerCase().includes(query) ||
        entry.meaning?.toLowerCase().includes(query)
    );
  }, [dueReviews, searchQuery]);

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

        {/* Tabs */}
        <div className={`flex p-1.5 rounded-[16px] mt-4 ${isDark ? 'bg-[#101826]' : 'bg-gray2/70'}`}>
          <button 
            onClick={() => setActiveTab("roots")}
            className={`flex-1 py-2.5 text-[14px] font-extrabold rounded-[12px] transition-all ${
              activeTab === "roots" ? (isDark ? 'bg-[#202E45] text-white' : 'bg-white text-blue shadow-sm') : (isDark ? 'text-[#50728D] hover:text-[#A1B2C3]' : 'text-text-light hover:text-text')
            }`}
          >
            Known Roots
          </button>
          <button 
            onClick={() => setActiveTab("audit")}
            className={`flex-1 py-2.5 text-[14px] font-extrabold rounded-[12px] transition-all ${
              activeTab === "audit" ? (isDark ? 'bg-[#202E45] text-white' : 'bg-white text-blue shadow-sm') : (isDark ? 'text-[#50728D] hover:text-[#A1B2C3]' : 'text-text-light hover:text-text')
            }`}
          >
            Audit Trail
          </button>
          <button 
            onClick={() => setActiveTab("review")}
            className={`flex-1 py-2.5 text-[14px] font-extrabold rounded-[12px] transition-all flex items-center justify-center gap-2 ${
              activeTab === "review" ? (isDark ? 'bg-[#202E45] text-white' : 'bg-white text-blue shadow-sm') : (isDark ? 'text-[#50728D] hover:text-[#A1B2C3]' : 'text-text-light hover:text-text')
            }`}
          >
            Review Status
            {dueReviews.length > 0 && (
              <span className="bg-red text-white text-[10px] px-1.5 py-0.5 rounded-full">{dueReviews.length}</span>
            )}
          </button>
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
            
            {/* --- KNOWN ROOTS TAB --- */}
            {activeTab === "roots" && (
              <>
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
            </>
            )}

            {/* --- AUDIT TRAIL TAB --- */}
            {activeTab === "audit" && (
              <div className={`overflow-x-auto overflow-y-auto max-h-[65vh] w-full rounded-[16px] border ${isDark ? 'border-[#1E314A] bg-[#152336]' : 'border-gray2 bg-white'}`}>
                <table className={`w-full text-left text-[13px] ${isDark ? 'text-white' : 'text-text'}`}>
                  <thead className={`sticky top-0 z-10 shadow-sm ${isDark ? 'bg-[#152336]' : 'bg-white'}`}>
                    <tr className={`text-[10px] uppercase font-bold tracking-wider border-b ${isDark ? 'text-[#50728D] border-[#1E314A]' : 'text-gray1 border-gray2'}`}>
                      <th className="py-4 px-4 min-w-[80px]">WORD</th>
                      <th className="py-4 px-3 min-w-[50px]">AYAH</th>
                      <th className="py-4 px-3 min-w-[80px]">VERDICT</th>
                      <th className="py-4 px-3 min-w-[50px]">RULE</th>
                      <th className="py-4 px-4 min-w-[150px]">REASON</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDecisions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-[13px] opacity-60">No decisions found. Start a lesson to build your audit trail!</td>
                      </tr>
                    ) : filteredDecisions.map((decision, i) => (
                      <tr key={i} className={`border-b last:border-b-0 hover:bg-black/5 transition-colors ${isDark ? 'border-[#1E314A] hover:bg-white/5' : 'border-gray2'}`}>
                        <td className="py-4 px-4 font-quran text-[22px] leading-tight align-middle">
                          <div className="flex flex-col gap-1.5 items-start">
                            <span>{decision.arabic}</span>
                            <span className={`text-[11px] font-sans px-2 py-0.5 rounded-md font-bold tracking-wide w-fit ${isDark ? 'bg-[#202E45] text-[#A1B2C3]' : 'bg-[#F4F0FF] text-purple-dark'}`}>
                              {decision.root || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-3 font-bold align-middle">{decision.ayah_key}</td>
                        <td className="py-4 px-3 align-middle">
                          <span className={`text-[11px] font-black uppercase flex items-center gap-1.5 ${
                            (decision.verdict === 'skip' || decision.verdict === 'particle') ? (isDark ? 'text-[#A1B2C3]' : 'text-gray1') : 
                            (decision.verdict === 'NEW' || decision.verdict === 'new') ? (isDark ? 'text-[#60E0C1]' : 'text-green-dark') : 
                            (isDark ? 'text-[#FFB84D]' : 'text-orange-dark')
                          }`}>
                            {(decision.verdict === 'skip' || decision.verdict === 'particle') ? <span className="opacity-70">⊘ skip</span> : (decision.verdict === 'NEW' || decision.verdict === 'new') ? '✓ NEW' : '↻ reinforce'}
                          </span>
                        </td>
                        <td className="py-4 px-3 align-middle">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-md inline-block ${
                            (decision.verdict === 'NEW' || decision.verdict === 'new') ? (isDark ? 'bg-[#1A3D24] text-[#4DFF88]' : 'bg-green-light text-green-dark') :
                            decision.rule === 'L1' ? (isDark ? 'bg-[#1A2D4D] text-[#7AC0FF]' : 'bg-[#E6F4F1] text-blue-dark') :
                            (isDark ? 'bg-[#3D2E1A] text-[#FFB84D]' : 'bg-orange-light text-orange-dark')
                          }`}>{decision.rule || "L0"}</span>
                        </td>
                        <td className={`py-4 px-4 text-[13px] leading-snug align-middle ${isDark ? 'text-[#A1B2C3]' : 'text-text-light'}`}>
                          {(() => {
                            let r = decision.reason || "";
                            if (r.startsWith("Same root,") && decision.root) {
                              r = r.replace("Same root,", `Same root ${decision.root},`);
                            }
                            if (decision.verdict !== "NEW" && decision.verdict !== "new") {
                              const kEntry = ledger.find(l => l.root === decision.root || l.lemma === decision.root);
                              const firstAt = kEntry?.first_ayah_key || kEntry?.first_seen_ayah;
                              if (firstAt && !r.includes("First at")) {
                                r += `. First at ${firstAt}`;
                              }
                            }
                            return r;
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* --- REVIEW STATUS TAB --- */}
            {activeTab === "review" && (
              <>
                <div className={`text-[12px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-[#50728D]' : 'text-gray1'}`}>
                  {filteredReviews.length} Words Due for Review
                </div>
                {filteredReviews.length === 0 ? (
                  <div className={`text-center py-10 ${isDark ? 'text-[#A1B2C3]' : 'text-text-light'}`}>
                    <div className="text-[40px] mb-2">🎉</div>
                    No words currently due for review!
                  </div>
                ) : filteredReviews.map((entry) => (
                  <div key={entry.id} className={`rounded-[20px] p-4 border-2 transition-all hover:-translate-y-1 ${
                    isDark ? 'bg-[#152336] border-[#1E314A] shadow-md' : 'bg-white border-gray2 shadow-sm'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col">
                        <span className={`text-[28px] font-quran font-bold leading-none mb-0.5 ${isDark ? 'text-[#60E0C1]' : 'text-blue-dark'}`}>
                          {entry.arabic}
                        </span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${isDark ? "bg-[#3D1A1A] text-[#FF6B6B]" : "bg-red-light text-red-dark"}`}>
                        Review Now
                      </span>
                    </div>
                    
                    <div className={`text-[13px] font-semibold mb-2 ${isDark ? 'text-white' : 'text-text'}`}>
                      {entry.meaning}
                    </div>

                    <div className={`flex items-center gap-2 text-[11px] font-bold ${isDark ? 'text-[#A1B2C3]' : 'text-text-light'}`}>
                      <span className={`px-2 py-0.5 rounded-md ${isDark ? 'bg-[#202E45]' : 'bg-gray3'}`}>
                        Root: {entry.root}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md ${isDark ? 'bg-[#202E45]' : 'bg-gray3'}`}>
                        {entry.hint}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md ${isDark ? 'bg-[#202E45]' : 'bg-gray3'}`}>
                        From {entry.ref}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
