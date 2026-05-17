"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getStorageProvider } from "@/lib/storage";
import { runDedupEngine, DedupedWord } from "@/lib/dedup-engine";
import { trackEvent } from "@/lib/analytics";
import { stripStopMarks } from "@/lib/quran";

interface WordMorphology {
  root: string;
  pos: string;
  features: string[];
  lemma: string;
  form: string;
  frequency: number;
  description?: string;
}

interface LessonWord {
  position: number;
  arabic: string;
  translation: string;
  transliteration: string;
  audioUrl: string | null;
  morphology: WordMorphology | null;
}

interface LessonData {
  ayahKey: string;
  verseNumber: number;
  juzNumber: number;
  arabic: string;
  translation: string;
  tafsir: string;
  words: DedupedWord[];
  lang: string;
  ayahAudioUrl: string | null;
  nextAyahKey: string | null;
}

interface LessonScreenProps {
  ayahKey: string;
  lang: string;
  translationId: number | null;
  tafsirId: number | null;
  theme: "light" | "dark";
  storageMode: "guest" | "cloud";
  onGoHome: () => void;
  onAwardXP: (amount: number, msg: string) => void;
  onLoseHeart: () => void;
  onNextAyah: (nextKey: string) => void;
}

type Tab = "Meaning" | "Context" | "Tafsir";

// Truncates text to a specific number of sentences
function getShortTafsir(text: string) {
  if (!text) return "No tafsir available.";
  const plainText = text.replace(/<[^>]+>/g, ""); // Strip HTML
  const sentences = plainText.match(/[^.!?]+[.!?]+/g) || [plainText];
  return sentences.slice(0, 2).join(" ").trim();
}



export default function LessonScreen({ ayahKey, lang, translationId, tafsirId, theme, storageMode, onGoHome, onAwardXP, onLoseHeart, onNextAyah }: LessonScreenProps) {
  const [data, setData] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [learnedPositions, setLearnedPositions] = useState<Set<number>>(new Set());
  const [newlyLearnedRoots, setNewlyLearnedRoots] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<Tab>("Meaning");

  const [relatedForms, setRelatedForms] = useState<string[]>([]);
  const [loadingForms, setLoadingForms] = useState(false);

  const wordAudioRef = useRef<HTMLAudioElement>(null);
  const ayahAudioRef = useRef<HTMLAudioElement>(null);

  const isDark = theme === "dark";

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const fetchAyahAndDedup = async () => {
      try {
        const params = new URLSearchParams({ lang });
        if (translationId) params.set("translationId", String(translationId));
        if (tafsirId) params.set("tafsirId", String(tafsirId));
        const r = await fetch(`/api/lesson/${ayahKey}?${params}`);
        if (!r.ok) throw new Error(`API error: ${r.status}`);
        const rawData = await r.json();

        const provider = getStorageProvider(storageMode);
        await provider.init();
        const knownRoots = await provider.getKnownRoots();

        const dedupedWords = runDedupEngine(rawData.words, knownRoots);
        
        let initialIdx = 0;
        const initialLearned = new Set<number>();
        setNewlyLearnedRoots(new Set());
        while (initialIdx < dedupedWords.length) {
          const w = dedupedWords[initialIdx];
          if (w.status === "known" || w.status === "particle") {
            initialLearned.add(w.position);
            initialIdx++;
          } else {
            break;
          }
        }
        
        setData({ ...rawData, words: dedupedWords });
        setCurrentWordIndex(initialIdx);
        setLearnedPositions(initialLearned);
        setActiveTab("Meaning");
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAyahAndDedup();
  }, [ayahKey, lang, storageMode]);

  // Auto-play word audio when index changes, and fetch related forms
  useEffect(() => {
    if (!data) return;
    
    const targetWord = data.words[currentWordIndex];
    if (targetWord?.audioUrl && wordAudioRef.current) {
      wordAudioRef.current.load();
      wordAudioRef.current.play().catch(() => { /* ignore autoplay blocks */ });
    }

    if (targetWord?.morphology?.root) {
      setLoadingForms(true);
      fetch(`/api/lesson/${ayahKey}/concordance?pos=${targetWord.position}&text=${encodeURIComponent(targetWord.arabic)}`)
        .then(r => r.json())
        .then(d => setRelatedForms(d.relatedForms || []))
        .catch(() => setRelatedForms([]))
        .finally(() => setLoadingForms(false));
    } else {
      setRelatedForms([]);
    }
  }, [currentWordIndex, data, ayahKey]);

  const handleNextWord = useCallback(async () => {
    if (!data) return;
    const word = data.words[currentWordIndex];
    
    let updatedLearnedRoots = newlyLearnedRoots;

    if (!learnedPositions.has(word.position)) {
      // If it's a new or reinforce word, mark it learned
      if (word.status === "new" || word.status === "reinforce") {
        const root = word.morphology?.root || word.morphology?.lemma || word.arabic;
        updatedLearnedRoots = new Set(newlyLearnedRoots).add(root);
        setNewlyLearnedRoots(updatedLearnedRoots);

        const provider = getStorageProvider(storageMode);
        await provider.markWordLearned({
          ayahKey,
          position: word.position,
          arabic: word.arabic,
          root,
          lemma: word.morphology?.lemma || word.arabic,
          pos: word.morphology?.pos || "particle",
          translation: word.translation,
          frequencyRoot: word.morphology?.frequency || 0,
        });
        
        const xpAmount = word.status === "new" ? 10 : 5;
        await provider.updateXP(xpAmount);
        onAwardXP(xpAmount, `+${xpAmount} XP`);

        trackEvent("word_learned", { 
          root, 
          status: word.status, 
          ayah: ayahKey, 
          xp: xpAmount 
        });
      }
      setLearnedPositions((prev) => new Set(prev).add(word.position));
    }
    
    // Auto-skip logic for next words (including words we just learned the root for)
    let nextIdx = currentWordIndex + 1;
    while (nextIdx < data.words.length) {
      const nextW = data.words[nextIdx];
      const nextWRoot = nextW.morphology?.root || nextW.morphology?.lemma || nextW.arabic;
      const isActuallyKnown = nextW.status === "known" || nextW.status === "particle" || updatedLearnedRoots.has(nextWRoot);

      if (isActuallyKnown && !learnedPositions.has(nextW.position)) {
        setLearnedPositions((prev) => new Set(prev).add(nextW.position));
        nextIdx++;
      } else {
        break;
      }
    }
    setCurrentWordIndex(nextIdx);
  }, [currentWordIndex, data, learnedPositions, onAwardXP, storageMode, ayahKey]);

  const handleNextAyah = () => {
    if (data?.nextAyahKey) {
      onNextAyah(data.nextAyahKey);
    } else {
      onGoHome();
    }
  };

  const playWordAudio = () => {
    if (wordAudioRef.current) {
      wordAudioRef.current.currentTime = 0; 
      wordAudioRef.current.play(); 
    }
  };

  const playAyahAudio = () => {
    if (ayahAudioRef.current) {
      ayahAudioRef.current.currentTime = 0; 
      ayahAudioRef.current.play(); 
    }
  };

  const isAyahComplete = data ? currentWordIndex >= data.words.length : false;
  
  // Capture decisions when ayah is complete
  useEffect(() => {
    if (isAyahComplete && data?.words && data.words.length > 0) {
      const saveAllDecisions = async () => {
        try {
          const provider = getStorageProvider(storageMode);
          const decisions = data.words.map((w: any) => ({
            ayah_key: data.ayahKey,
            word_position: w.position,
            arabic: w.arabic,
            root: w.morphology?.root || w.morphology?.lemma || w.arabic,
            dedup_level: w.rule === "NEW" ? 0 : parseInt(String(w.rule).replace(/[^0-9]/g, '') || '1', 10),
            rule: w.rule,
            verdict: w.verdict,
            reason: w.reason,
            xp_awarded: w.verdict === "NEW" ? 10 : (w.verdict === "reinforce" ? 5 : 0),
            decided_at: new Date().toISOString(),
          }));
          await provider.saveDecisions(decisions);
        } catch (e) {
          console.error("Failed to save decisions:", e);
        }
      };
      saveAllDecisions();
    }
  }, [isAyahComplete, data, storageMode]);

  if (loading) {
    return (
      <div className={`flex-1 flex items-center justify-center p-3.5 ${isDark ? 'bg-[#0B1121] text-white' : ''}`}>
        <div className="text-center">
          <div className="spinner mx-auto mb-3" style={{ width: 28, height: 28, borderWidth: 3 }} />
          <div className={`text-[12px] font-bold ${isDark ? 'text-[#50728D]' : 'text-text-light'}`}>Loading ayah {ayahKey}…</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`flex-1 p-3.5 text-center py-20 ${isDark ? 'bg-[#0B1121] text-white' : ''}`}>
        <div className="text-[40px] mb-3">⚠️</div>
        <h3 className={`text-[15px] font-black mb-1 ${isDark ? 'text-white' : 'text-text'}`}>Failed to load lesson</h3>
        <p className={`text-[12px] mb-4 ${isDark ? 'text-[#A1B2C3]' : 'text-text-light'}`}>{error}</p>
        <button onClick={onGoHome} className="cta-btn max-w-[200px] mx-auto">Back to Home</button>
      </div>
    );
  }

  if (isAyahComplete) {
    return (
      <div className={`flex-1 flex flex-col justify-center p-6 ${isDark ? 'bg-[#0B1121]' : 'bg-[#F0F4F8]'}`}>
        <div className="bg-gradient-to-br from-green to-green-dark rounded-[var(--radius-card)] p-8 text-white text-center mb-3 animate-pop-in shadow-xl">
          <div className="text-[60px] mb-4">🎉</div>
          <h3 className="text-[26px] font-black mb-2">Ayah Complete!</h3>
          <p className="text-[15px] opacity-90 mb-8 font-bold">
            You reviewed {data.words.length} words in Surah {data.ayahKey}
          </p>
          
          <div className="flex flex-col gap-3">
            {data.nextAyahKey ? (
              <button
                onClick={handleNextAyah}
                className="w-full py-4 bg-white text-green-dark rounded-[var(--radius-card)] font-extrabold text-[16px] border-none cursor-pointer hover:bg-gray-50 active:scale-95 transition-all shadow-md"
              >
                Continue to Ayah {data.nextAyahKey} →
              </button>
            ) : null}
            <button
              onClick={onGoHome}
              className="w-full py-4 bg-transparent border-2 border-white/30 text-white rounded-[var(--radius-card)] font-bold text-[15px] cursor-pointer hover:bg-white/10 transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const targetWord = data.words[currentWordIndex];
  const morph = targetWord.morphology;
  const isAlreadyLearned = learnedPositions.has(targetWord.position);

  // Dynamic classes based on theme
  const bgMain = isDark ? "bg-[#0B1121]" : "bg-[#F0F4F8]";
  const heroBg = isDark ? "bg-[#152336] border-[#1E314A]" : "bg-blue-light/50 border-blue/20";
  const heroText = isDark ? "text-[#60E0C1]" : "text-blue-dark";
  const rootTextClass = isDark ? "text-[#A1B2C3]" : "text-text-light";
  
  const tabContainer = isDark ? "bg-[#101826]" : "bg-gray2/70";
  const activeTabClass = isDark ? "bg-[#202E45] text-white" : "bg-white text-blue shadow-sm";
  const inactiveTabClass = isDark ? "text-[#50728D] hover:text-[#A1B2C3]" : "text-text-light hover:text-text";
  
  const cardBg = isDark ? "bg-[#152336] border-[#1E314A]" : "bg-white border-gray-100";
  const cardTitle = isDark ? "text-[#50728D]" : "text-text-light";
  const cardText = isDark ? "text-white" : "text-blue-dark";
  const cardMuted = isDark ? "text-[#A1B2C3]" : "text-text-light";

  return (
    <div className={`flex-1 flex flex-col overflow-hidden ${bgMain} transition-colors duration-300`}>
      
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        
        {/* ── 1. Hero Card ── */}
        <div className={`${heroBg} border-[2px] rounded-[32px] p-8 mb-4 relative flex flex-col items-center justify-center min-h-[240px] shadow-sm animate-fade-in`}>
          <div className="text-[76px] font-quran leading-tight mb-8 drop-shadow-md" style={{ color: isDark ? '#60E0C1' : '' }}>
            <span className={!isDark ? heroText : ''}>{stripStopMarks(targetWord.arabic)}</span>
          </div>

          {targetWord.audioUrl && (
            <>
              <audio ref={wordAudioRef} src={targetWord.audioUrl} preload="auto" />
              <button 
                onClick={playWordAudio}
                className={`absolute -bottom-7 w-[64px] h-[64px] rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-105 active:scale-95 border-4 ${isDark ? 'bg-[#4A4C3B] text-[#D4AF37] border-[#0B1121]' : 'bg-[#D4AF37] text-white border-[#F0F4F8]'}`}
              >
                <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Root Display (below hero) */}
        <div className={`text-center font-quran text-[26px] ${rootTextClass} mb-3 tracking-[0.3em] h-8 mt-2`}>
          {morph?.root || ""}
        </div>

        {/* Status Badge */}
        <div className="flex justify-center mb-6">
          {targetWord.status === "new" && <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-light text-green-dark">New Root</span>}
          {targetWord.status === "reinforce" && <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-light text-purple-dark">Reinforce</span>}
          {targetWord.status === "known" && <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-200 text-gray-600">Known Word</span>}
          {targetWord.status === "particle" && <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-light text-blue-dark">Particle</span>}
        </div>

        {/* ── 2. Tab Navigation ── */}
        <div className={`flex p-1.5 rounded-[16px] mb-5 ${tabContainer}`}>
          {["Meaning", "Context", "Tafsir"].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as Tab)}
              className={`flex-1 py-3 text-[14px] font-extrabold rounded-[12px] transition-all ${
                activeTab === tab ? activeTabClass : inactiveTabClass
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── 3. Tab Content ── */}
        <div className="animate-fade-in pb-4">
          
          {/* MEANING TAB */}
          {activeTab === "Meaning" && (
            <div className="flex flex-col gap-3">
              <div className={`${cardBg} border-2 rounded-[24px] p-6 shadow-sm`}>
                <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${cardTitle}`}>Meaning</div>
                <div className={`text-[28px] font-black leading-tight mb-3 ${cardText}`}>
                  {targetWord.translation}
                </div>
                <div className={`text-[14px] font-bold flex flex-wrap items-center gap-1.5 ${cardMuted}`}>
                  <span>{morph?.pos || "Word"}</span>
                  {morph?.frequency ? (
                    <>
                      <span className="opacity-50">-</span>
                      <span>{morph.frequency} occurrences</span>
                    </>
                  ) : null}
                  {morph?.features?.map((f) => (
                    <span key={f} className="flex items-center gap-1.5">
                      <span className="opacity-50">-</span>
                      <span>{f}</span>
                    </span>
                  ))}
                </div>
              </div>

              {(morph?.lemma || relatedForms.length > 0 || loadingForms) && (
                <div className={`${cardBg} border-2 rounded-[24px] p-6 shadow-sm`}>
                  <div className={`text-[10px] font-black uppercase tracking-widest mb-4 ${cardTitle}`}>Related Forms</div>
                  <div className="flex flex-wrap gap-3">
                    {morph?.lemma && (
                      <span className={`px-4 py-2.5 rounded-xl text-[20px] font-bold border-2 ${isDark ? 'bg-[#202E45] border-[#284155] text-[#60E0C1]' : 'bg-[#F4F0FF] border-[#E0D4F5] text-purple-dark'}`}>
                        <span className="font-quran">{morph.lemma}</span>
                      </span>
                    )}
                    
                    {loadingForms && (
                       <span className={`px-4 py-2.5 rounded-xl flex items-center ${isDark ? 'bg-[#202E45] text-[#A1B2C3]' : 'bg-gray3 text-text-light'}`}>
                         <span className="spinner mr-2" style={{ width: 14, height: 14, borderWidth: 2 }} /> Loading...
                       </span>
                    )}

                    {!loadingForms && relatedForms.map(form => (
                      <span key={form} className={`px-4 py-2.5 rounded-xl text-[20px] font-bold border-2 transition-transform hover:scale-105 ${isDark ? 'bg-[#1A283B] border-[#284155] text-white' : 'bg-white border-gray2 text-blue-dark'}`}>
                        <span className="font-quran">{form}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CONTEXT TAB */}
          {activeTab === "Context" && (
            <div className={`${cardBg} border-2 rounded-[24px] p-6 shadow-sm`}>
              <div className="flex justify-between items-center mb-6">
                <div className={`text-[10px] font-black uppercase tracking-widest ${cardTitle}`}>Ayah in Context</div>
                {data.ayahAudioUrl && (
                  <>
                    <audio ref={ayahAudioRef} src={data.ayahAudioUrl} preload="none" />
                    <button 
                      onClick={playAyahAudio}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-[#4A4C3B] text-[#D4AF37] hover:bg-[#5A5C4B]' : 'bg-blue-light text-blue hover:bg-blue hover:text-white'}`}
                    >
                      <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
              
              {/* Arabic Context */}
              <div className="flex flex-wrap gap-x-2 gap-y-5 justify-start mb-8" dir="rtl">
                {data.words.map((w, idx) => {
                  const isTarget = idx === currentWordIndex;
                  const wordClass = isTarget 
                    ? (isDark ? "bg-[#284155] text-[#60E0C1] px-2 py-1 rounded-xl" : "bg-[#E6F4F1] text-blue-dark px-2 py-1 rounded-xl")
                    : (isDark ? "text-[#50728D]" : "text-text opacity-50");
                    
                  return (
                    <span 
                      key={w.position} 
                      className={`font-quran text-[32px] leading-loose transition-all duration-300 ${wordClass}`}
                    >
                      {w.arabic}
                    </span>
                  );
                })}
              </div>
              
              {/* English Context - Word by Word with Highlight */}
              <div className={`text-[16px] leading-relaxed italic text-left mb-4 ${isDark ? 'text-white' : 'text-text'}`}>
                 "
                 {data.words.map((w, idx) => {
                   const isTarget = idx === currentWordIndex;
                   const highlightClass = isTarget 
                     ? (isDark ? "text-[#60E0C1] font-bold underline decoration-2 underline-offset-4" : "bg-yellow-100 text-black font-bold px-1 rounded inline-block shadow-sm") 
                     : "";
                   return (
                     <span key={w.position} className={highlightClass}>
                       {w.translation}{" "}
                     </span>
                   );
                 })}
                 " — {data.ayahKey}
              </div>

              {/* English Context - Semantic Ayah Translation */}
              <div className={`text-[14px] leading-relaxed text-left opacity-70 border-l-4 pl-4 ${isDark ? 'border-[#284155] text-[#A1B2C3]' : 'border-blue-light text-text-light'}`}>
                 {data.translation}
              </div>
            </div>
          )}

          {/* TAFSIR TAB */}
          {activeTab === "Tafsir" && (
            <div className={`${cardBg} border-2 rounded-[24px] p-7 shadow-md relative overflow-hidden`}>
              <div className={`absolute top-0 left-0 w-1.5 h-full ${isDark ? 'bg-[#4A4C3B]' : 'bg-purple'}`} />
              
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${isDark ? 'bg-[#202E45]' : 'bg-purple-light/30'}`}>
                    <svg className={`w-4 h-4 ${isDark ? 'text-[#60E0C1]' : 'text-purple'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className={`text-[11px] font-black uppercase tracking-widest ${cardTitle}`}>Tafsir Excerpt</div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${isDark ? 'bg-[#352C4B] text-[#B495DF]' : 'bg-purple-light text-purple-dark'}`}>
                  Ibn Kathir
                </div>
              </div>

              <div className={`text-[16px] leading-[1.7] text-justify mb-6 ${isDark ? 'text-white' : 'text-text'}`}>
                <span className={`text-[24px] leading-none font-serif opacity-30 float-left mr-2 mt-1 ${isDark ? 'text-white' : 'text-purple'}`}>“</span>
                {getShortTafsir(data.tafsir)}
              </div>

              {morph?.description && (
                <div className={`p-4 rounded-xl border-l-4 ${isDark ? 'bg-[#101826]/50 border-[#284155] text-[#A1B2C3]' : 'bg-gray3 border-gray2 text-text-light'}`}>
                  <div className={`text-[10px] font-black uppercase tracking-wider mb-1.5 ${isDark ? 'text-[#60E0C1]' : 'text-blue'}`}>Grammar Insight</div>
                  <div className="text-[13px] leading-relaxed">
                    {morph.description}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── Fixed Bottom Action Bar (Non-Scrolling) ── */}
      <div className={`p-4 border-t-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 ${isDark ? 'bg-[#0B1121] border-[#1E314A]' : 'bg-white border-gray2'}`}>
        <button 
          onClick={handleNextWord} 
          className={`w-full text-white rounded-2xl py-4 px-6 text-[16px] font-black uppercase tracking-wide border-b-4 active:border-b-0 active:translate-y-[4px] transition-all ${
            isAlreadyLearned 
              ? 'bg-blue hover:bg-blue-dark border-blue-dark shadow-[0_4px_0_var(--color-blue-dark)]' 
              : 'bg-green hover:bg-green-dark border-[#3D8F02] shadow-[0_4px_0_#3D8F02]'
          }`}
        >
          {isAlreadyLearned ? "Continue →" : (targetWord.status === "new" ? "✓ Mark Learned (+10 XP)" : "✓ Reinforce (+5 XP)")}
        </button>
      </div>
    </div>
  );
}
