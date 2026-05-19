"use client";

import { useState, useCallback, useEffect } from "react";
import type { ScreenId, LangCode } from "@/lib/constants";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import HomeScreen from "@/components/screens/HomeScreen";
import SettingsScreen from "@/components/screens/SettingsScreen";
import ReviewScreen from "@/components/screens/ReviewScreen";
import LessonScreen from "@/components/screens/LessonScreen";
import OnboardingScreen from "@/components/screens/OnboardingScreen";
import LedgerScreen from "@/components/screens/LedgerScreen";
import LearningPathScreen from "@/components/screens/LearningPathScreen";
import ProfileScreen from "@/components/screens/ProfileScreen";
import RoomsScreen from "@/components/screens/RoomsScreen";
import SurahPickerScreen from "@/components/screens/SurahPickerScreen";
import { getStorageProvider } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { getJuzInfo } from "@/lib/quran";
import { getSurahById } from "@/data/surah-data";

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const v = document.cookie.match("(^|;) ?" + name + "=([^;]*)(;|$)");
  return v ? v[2] : null;
}

export default function App() {
  const [screen, setScreen] = useState<ScreenId>("home");
  const [xp, setXp] = useState(0);
  const [dailyXp, setDailyXp] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [lastHeartRefill, setLastHeartRefill] = useState<string>(new Date().toISOString());
  const [streakDays, setStreakDays] = useState(0);
  const [displayInitial, setDisplayInitial] = useState("A");
  const [lang, setLang] = useState<LangCode>("en");
  const [translationId, setTranslationId] = useState<number | null>(131);  // The Clear Quran (English)
  const [tafsirId, setTafsirId] = useState<number | null>(169);           // Ibn Kathir (English)
  const [reviewLimit, setReviewLimit] = useState(20);
  const [newWordsLimit, setNewWordsLimit] = useState(10);
  
  const targetXp = (newWordsLimit * 10) + (reviewLimit * 5);

  const [currentAyah, setCurrentAyah] = useState("1:1");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [storageMode, setStorageMode] = useState<"guest" | "cloud">("cloud");

  // Surah progress
  const [completedAyahCount, setCompletedAyahCount] = useState(0);
  const [completedSurahs, setCompletedSurahs] = useState<number[]>([]);

  // XP popup
  const [xpMsg, setXpMsg] = useState("");
  const [showXpPop, setShowXpPop] = useState(false);

  function navigate(id: ScreenId) {
    setScreen(id);
  }

  const handleSetTheme = useCallback((newTheme: "light" | "dark") => {
    setTheme(newTheme);
    const provider = getStorageProvider(storageMode);
    provider.saveLocalPreferences({ theme: newTheme });
  }, [storageMode]);

  const handleSetReviewLimit = useCallback((limit: number) => {
    setReviewLimit(limit);
    const provider = getStorageProvider(storageMode);
    provider.saveLocalPreferences({ reviewLimit: limit });
  }, [storageMode]);

  const handleSetNewWordsLimit = useCallback((limit: number) => {
    setNewWordsLimit(limit);
    const provider = getStorageProvider(storageMode);
    provider.saveLocalPreferences({ newWordsLimit: limit });
  }, [storageMode]);

  // Language handler — resolves default translation/tafsir IDs dynamically
  const handleSetLang = useCallback(async (code: LangCode, newTranslationId?: number, newTafsirId?: number) => {
    setLang(code);
    const provider = getStorageProvider(storageMode);
    
    let tId: number;
    if (newTranslationId !== undefined) {
      tId = newTranslationId;
    } else {
      // Resolve default IDs from server
      try {
        const r = await fetch(`/api/languages?translations=${code}`);
        const d = await r.json();
        const translations = d.translations || [];
        if (translations.length > 0) {
          tId = translations[0].id;
        } else {
          tId = 131; // Fallback
        }
      } catch {
        tId = 131; // Fallback to English
      }
    }
    
    setTranslationId(tId);
    if (newTafsirId !== undefined) setTafsirId(newTafsirId);
    
    provider.saveLocalPreferences({ 
      lang: code, 
      translationId: tId, 
      ...(newTafsirId !== undefined ? { tafsirId: newTafsirId } : {}) 
    });
  }, [storageMode]);

  const awardXP = useCallback((amount: number, msg: string) => {
    setXp((prev) => {
      const next = prev + amount;
      // Persist total XP to storage
      const provider = getStorageProvider(storageMode);
      provider.updateXP(amount);
      return next;
    });
    setDailyXp((prev) => {
      const next = prev + amount;
      const provider = getStorageProvider(storageMode);
      provider.updateDailyGoal(next, next >= targetXp);
      return next;
    });
    setXpMsg(msg);
    setShowXpPop(true);
    setTimeout(() => setShowXpPop(false), 900);
  }, [storageMode, targetXp]);

  const loseHeart = useCallback(async () => {
    setHearts((prev) => {
      const next = Math.max(0, prev - 1);
      const provider = getStorageProvider(storageMode);
      provider.saveHearts(next, lastHeartRefill);
      return next;
    });
  }, [storageMode, lastHeartRefill]);

  const startLesson = useCallback(async (ayahKey?: string) => {
    if (hearts <= 0) {
      alert("You are out of hearts! ❤️ Wait for them to refill or practice old words in the Review tab to keep your momentum going.");
      return;
    }
    if (ayahKey) {
      setCurrentAyah(ayahKey);
      const provider = getStorageProvider(storageMode);
      provider.saveCurrentAyah(ayahKey);
      
      // Track per-surah progress
      const [surahStr, verseStr] = ayahKey.split(":");
      const surahId = parseInt(surahStr);
      const verse = parseInt(verseStr);
      const progress = await provider.getSurahProgress();
      progress.currentSurahId = surahId;
      // Only update if this is further than before
      const prevVerse = progress.surahAyahMap[surahId] || 0;
      if (verse > 1 && verse - 1 > prevVerse) {
        progress.surahAyahMap[surahId] = verse - 1;
      }
      await provider.saveSurahProgress(progress);
      
      // Update React state so TopBar reflects immediately
      let totalCompleted = 0;
      for (const [, versesDone] of Object.entries(progress.surahAyahMap)) {
        totalCompleted += Number(versesDone);
      }
      setCompletedAyahCount(totalCompleted);
    }
    setScreen("lesson");
  }, [storageMode, hearts]);

  const handleSurahSelect = useCallback(async (surahId: number) => {
    const ayahKey = `${surahId}:1`;
    const provider = getStorageProvider(storageMode);
    
    // Load existing progress and update current surah
    const progress = await provider.getSurahProgress();
    const currentVerse = progress.surahAyahMap[surahId] || 0;
    const surah = getSurahById(surahId);
    const isCompleted = progress.completedSurahs.includes(surahId);
    
    // If completed or not started, start from verse 1; otherwise resume
    const resumeKey = isCompleted ? `${surahId}:1` : (currentVerse > 0 ? `${surahId}:${currentVerse + 1}` : `${surahId}:1`);
    // Clamp to max verse
    const maxVerse = surah?.verses || 999;
    const [s, v] = resumeKey.split(":").map(Number);
    const safeKey = v > maxVerse ? `${surahId}:1` : resumeKey;
    
    progress.currentSurahId = surahId;
    if (!progress.surahAyahMap[surahId]) progress.surahAyahMap[surahId] = 0;
    await provider.saveSurahProgress(progress);
    
    setCurrentAyah(safeKey);
    await provider.saveCurrentAyah(safeKey);
    startLesson(safeKey);
  }, [storageMode, startLesson]);

  const handleSurahComplete = useCallback(async (surahId: number) => {
    const provider = getStorageProvider(storageMode);
    const progress = await provider.getSurahProgress();
    
    // Mark surah as completed
    if (!progress.completedSurahs.includes(surahId)) {
      progress.completedSurahs.push(surahId);
    }
    const surah = getSurahById(surahId);
    if (surah) progress.surahAyahMap[surahId] = surah.verses;
    
    await provider.saveSurahProgress(progress);
    
    // Update React state so TopBar/HomeScreen reflect immediately
    setCompletedSurahs([...progress.completedSurahs]);
    let totalCompleted = 0;
    for (const [, versesDone] of Object.entries(progress.surahAyahMap)) {
      totalCompleted += Number(versesDone);
    }
    setCompletedAyahCount(totalCompleted);
    
    setScreen("surah-picker");
  }, [storageMode]);

  useEffect(() => {
    // If QF redirects here with ?code=...&state=..., bounce it to our API route
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.has("code") && params.has("state")) {
        window.location.href = "/api/auth/callback" + window.location.search;
        return;
      }
    }
    
    setIsLoggedIn(!!getCookie("qf_logged_in"));
    
    if (getCookie("sb_custom_token")) {
      setStorageMode("cloud");
    }
  }, []);

  // Heart refill logic (1 every 4 hours)
  useEffect(() => {
    const checkRefill = () => {
      if (hearts >= 5) return;
      
      const now = new Date();
      const last = new Date(lastHeartRefill);
      const diffMs = now.getTime() - last.getTime();
      const hoursPassed = diffMs / (1000 * 60 * 60);
      
      if (hoursPassed >= 4) {
        const heartsToAdd = Math.floor(hoursPassed / 4);
        const newCount = Math.min(5, hearts + heartsToAdd);
        const newRefillDate = new Date(last.getTime() + (heartsToAdd * 4 * 60 * 60 * 1000)).toISOString();
        
        setHearts(newCount);
        setLastHeartRefill(newRefillDate);
        const provider = getStorageProvider(storageMode);
        provider.saveHearts(newCount, newRefillDate);
      }
    };

    const interval = setInterval(checkRefill, 60000); // Check every minute
    checkRefill(); // Initial check
    return () => clearInterval(interval);
  }, [hearts, lastHeartRefill, storageMode]);

  useEffect(() => {
    async function loadUser() {
      if (isLoggedIn === null) return;

      const provider = getStorageProvider(storageMode);

      // Always load local/fallback data first (works for guest mode AND cloud mode with localStorage fallback)
      const savedXp = await provider.getXP();
      setXp(savedXp);

      const ayah = await provider.getCurrentAyah();
      setCurrentAyah(ayah);

      // Load surah progress for accurate ayah counting
      const surahProg = await provider.getSurahProgress();
      setCompletedSurahs(surahProg.completedSurahs);
      // Calculate actual completed ayahs from surahAyahMap
      let totalCompleted = 0;
      for (const [, versesDone] of Object.entries(surahProg.surahAyahMap)) {
        totalCompleted += Number(versesDone);
      }
      setCompletedAyahCount(totalCompleted);

      const h = await provider.getHearts();
      setHearts(h.count);
      setLastHeartRefill(h.lastRefill);

      const goal = await provider.getDailyGoal();
      setDailyXp(goal.xp_earned);
      
      const prefs = await provider.getLocalPreferences();
      setLang(prefs.lang as LangCode);
      if (prefs.translationId) setTranslationId(prefs.translationId);
      if (prefs.tafsirId) setTafsirId(prefs.tafsirId);
      if (prefs.theme) setTheme(prefs.theme);
      if (prefs.reviewLimit) setReviewLimit(prefs.reviewLimit);
      if (prefs.newWordsLimit) setNewWordsLimit(prefs.newWordsLimit);

      // Only attempt cloud-specific data if logged in
      if (isLoggedIn && storageMode === "cloud") {
        try {
          const res = await fetch("/api/user/profile");
          if (res.ok) {
            const data = await res.json();
            if (data && data.display_initial) {
              setDisplayInitial(data.display_initial);
            }
          }
        } catch (e) {
          console.error("Failed to load user profile via API", e);
        }

        try {
          const res = await fetch("/api/user/streak");
          if (res.ok) {
            const data = await res.json();
            if (data && data.streak !== undefined) {
              setStreakDays(data.streak);
            }
          }
        } catch (e) {
          console.error("Failed to load QF streak via API", e);
        }
      }
    }
    loadUser();
  }, [isLoggedIn, storageMode]);

  const handleResetProgress = useCallback(async () => {
    if (window.confirm("Are you sure you want to completely wipe all your learned vocabulary and XP? This cannot be undone.")) {
      try {
        const provider = getStorageProvider(storageMode);
        await provider.clearAllProgress();
        // Also explicitly reset the current ayah and surah progress
        await provider.saveCurrentAyah("1:1");
        await provider.saveSurahProgress({ completedSurahs: [], currentSurahId: 1, surahAyahMap: { 1: 0 } });
        // Clear local decisions fallback, XP, surah progress, and goals
        if (typeof window !== "undefined") {
          localStorage.removeItem("quranlingo_decisions");
          localStorage.removeItem("quranlingo_xp");
          localStorage.removeItem("quranlingo_surah_progress");
          // Clear all goal keys
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("quranlingo_goal_")) {
              localStorage.removeItem(key);
              i--; // Adjust index after removal
            }
          }
        }
        // Reset React state
        setXp(0);
        setDailyXp(0);
        setCurrentAyah("1:1");
        setCompletedAyahCount(0);
        setCompletedSurahs([]);
        setScreen("home");
        // Reload to force a fresh data fetch everywhere
        setTimeout(() => window.location.reload(), 300);
      } catch (err) {
        console.error("Reset failed", err);
        alert("Failed to reset progress. See console for details.");
      }
    }
  }, [storageMode]);

  if (isLoggedIn === null) {
    return <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center">Loading...</div>;
  }

  if (!isLoggedIn && storageMode !== "guest") {
    return (
      <div className="flex justify-center min-h-screen p-4 bg-[#F0F4F8]">
        <div className="app-shell relative bg-white">
          <OnboardingScreen 
            onLogin={() => { window.location.href = "/api/auth/login"; }} 
            onGuest={() => setStorageMode("guest")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center min-h-screen p-4">
      <div className="app-shell relative">
        <TopBar
          xp={xp}
          hearts={hearts}
          streakDays={streakDays}
          juzLabel={getJuzInfo(currentAyah).label}
          displayInitial={displayInitial}
          theme={theme}
          onProfileClick={() => navigate("profile")}
          currentAyah={currentAyah}
          completedAyahCount={completedAyahCount}
        />

        {/* XP Popup */}
        {showXpPop && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 text-[14px] font-black text-green-dark bg-green-light px-4 py-1.5 rounded-full pointer-events-none z-50 animate-xp-burst">
            {xpMsg}
          </div>
        )}

        {/* ── Screens ── */}
        {screen === "home" && (
          <HomeScreen
            xp={xp}
            dailyXp={dailyXp}
            targetXp={targetXp}
            streak={streakDays}
            currentAyah={currentAyah}
            storageMode={storageMode}
            theme={theme}
            onStartReview={() => navigate("quiz")}
            onStartLesson={startLesson}
            onNavigateToRooms={() => navigate("rooms")}
            onPickSurah={() => navigate("surah-picker")}
            completedSurahs={completedSurahs}
            completedAyahCount={completedAyahCount}
          />
        )}

        {screen === "lesson" && (
          <LessonScreen
            ayahKey={currentAyah}
            lang={lang}
            translationId={translationId}
            tafsirId={tafsirId}
            theme={theme}
            storageMode={storageMode}
            onGoHome={() => navigate("home")}
            onAwardXP={awardXP}
            onLoseHeart={loseHeart}
            onNextAyah={startLesson}
            onSurahComplete={handleSurahComplete}
          />
        )}

        {screen === "quiz" && (
          <ReviewScreen 
            storageMode={storageMode} 
            onGoHome={() => navigate("home")} 
            onLoseHeart={loseHeart}
            limit={reviewLimit}
            streak={streakDays}
            theme={theme}
            onAwardXP={awardXP}
          />
        )}

        {screen === "settings" && (
          <SettingsScreen
            lang={lang}
            translationId={translationId}
            tafsirId={tafsirId}
            theme={theme}
            reviewLimit={reviewLimit}
            newWordsLimit={newWordsLimit}
            onSetLang={handleSetLang}
            onSetTheme={handleSetTheme}
            onSetReviewLimit={handleSetReviewLimit}
            onSetNewWordsLimit={handleSetNewWordsLimit}
            onResetProgress={handleResetProgress}
          />
        )}

        {screen === "ledger" && (
          <LedgerScreen storageMode={storageMode} theme={theme} />
        )}

        {screen === "rooms" && (
          <RoomsScreen storageMode={storageMode} theme={theme} />
        )}

        {screen === "map" && (
          <LearningPathScreen
            currentAyah={currentAyah}
            storageMode={storageMode}
            theme={theme}
            onNavigate={navigate}
          />
        )}

        {screen === "surah-picker" && (
          <SurahPickerScreen
            theme={theme}
            storageMode={storageMode}
            onSelectSurah={handleSurahSelect}
            onGoHome={() => navigate("home")}
          />
        )}

        {screen === "profile" && (
          <ProfileScreen 
            xp={xp}
            streak={streakDays}
            theme={theme}
            storageMode={storageMode}
            currentAyah={currentAyah}
            onGoHome={() => navigate("home")}
            completedAyahCount={completedAyahCount}
          />
        )}

        {/* Placeholder screens */}
        {["dedup", "glossika"].includes(screen) && (
          <div className="flex-1 overflow-y-auto p-3.5">
            <div className="text-center py-20">
              <div className="text-[48px] mb-4">
                🔧
              </div>
              <h2 className="text-[18px] font-black text-text mb-2">
                {screen.charAt(0).toUpperCase() + screen.slice(1)} Screen
              </h2>
              <p className="text-[13px] text-text-light mb-1">Building in progress…</p>
              <button onClick={() => navigate("home")} className="cta-btn mt-6 max-w-[200px] mx-auto">
                Back to Home
              </button>
            </div>
          </div>
        )}

        <BottomNav activeScreen={screen} onNavigate={navigate} theme={theme} />
      </div>
    </div>
  );
}
