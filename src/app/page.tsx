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
import JuzMapScreen from "@/components/screens/JuzMapScreen";
import { getStorageProvider } from "@/lib/storage";

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const v = document.cookie.match("(^|;) ?" + name + "=([^;]*)(;|$)");
  return v ? v[2] : null;
}

export default function App() {
  const [screen, setScreen] = useState<ScreenId>("home");
  const [xp, setXp] = useState(310);
  const [dailyXp, setDailyXp] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [lastHeartRefill, setLastHeartRefill] = useState<string>(new Date().toISOString());
  const [streakDays] = useState(12);
  const [displayInitial] = useState("A");
  const [lang, setLang] = useState<LangCode>("en");
  const [reviewLimit, setReviewLimit] = useState(20);
  const [newWordsLimit, setNewWordsLimit] = useState(10);
  
  const targetXp = (newWordsLimit * 10) + (reviewLimit * 5);

  const [currentAyah, setCurrentAyah] = useState("1:1");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [storageMode, setStorageMode] = useState<"guest" | "cloud">("cloud");

  // XP popup
  const [xpMsg, setXpMsg] = useState("");
  const [showXpPop, setShowXpPop] = useState(false);

  function navigate(id: ScreenId) {
    setScreen(id);
  }

  const awardXP = useCallback((amount: number, msg: string) => {
    setXp((prev) => prev + amount);
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

  const startLesson = useCallback((ayahKey?: string) => {
    if (hearts <= 0) {
      alert("You are out of hearts! ❤️ Wait for them to refill or practice old words in the Review tab to keep your momentum going.");
      return;
    }
    if (ayahKey) {
      setCurrentAyah(ayahKey);
      const provider = getStorageProvider(storageMode);
      provider.saveCurrentAyah(ayahKey);
    }
    setScreen("lesson");
  }, [storageMode, hearts]);

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
      if (!isLoggedIn && storageMode !== "guest") return;

      const provider = getStorageProvider(storageMode);
      
      const savedXp = await provider.getXP();
      setXp(savedXp);

      const ayah = await provider.getCurrentAyah();
      setCurrentAyah(ayah);

      const h = await provider.getHearts();
      setHearts(h.count);
      setLastHeartRefill(h.lastRefill);

      const goal = await provider.getDailyGoal();
      setDailyXp(goal.xp_earned);
    }
    loadUser();
  }, [isLoggedIn, storageMode]);

  const handleResetProgress = useCallback(async () => {
    if (window.confirm("Are you sure you want to completely wipe all your learned vocabulary and XP? This cannot be undone.")) {
      try {
        const provider = getStorageProvider(storageMode);
        await provider.clearAllProgress();
        // Also explicitly reset the current ayah in storage
        await provider.saveCurrentAyah("1:1");
        // Reset React state
        setXp(0);
        setCurrentAyah("1:1");
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
        <div className={`app-shell relative bg-white ${theme}`}>
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
      <div className={`app-shell relative ${theme}`}>
        <TopBar
          xp={xp}
          hearts={hearts}
          streakDays={streakDays}
          juzLabel="Juz 1 · Al-Fatiha"
          displayInitial={displayInitial}
          onProfileClick={() => navigate("profile")}
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
            onStartReview={() => navigate("quiz")}
            onStartLesson={startLesson}
          />
        )}

        {screen === "lesson" && (
          <LessonScreen
            ayahKey={currentAyah}
            lang={lang}
            theme={theme}
            storageMode={storageMode}
            onGoHome={() => navigate("home")}
            onAwardXP={awardXP}
            onLoseHeart={loseHeart}
            onNextAyah={startLesson}
          />
        )}

        {screen === "quiz" && (
          <ReviewScreen 
            storageMode={storageMode} 
            onGoHome={() => navigate("home")} 
            onLoseHeart={loseHeart}
            limit={reviewLimit}
          />
        )}

        {screen === "settings" && (
          <SettingsScreen
            lang={lang}
            theme={theme}
            reviewLimit={reviewLimit}
            newWordsLimit={newWordsLimit}
            onSetLang={setLang}
            onSetTheme={setTheme}
            onSetReviewLimit={setReviewLimit}
            onSetNewWordsLimit={setNewWordsLimit}
            onResetProgress={handleResetProgress}
          />
        )}

        {screen === "ledger" && (
          <LedgerScreen storageMode={storageMode} theme={theme} />
        )}

        {screen === "map" && (
          <JuzMapScreen
            currentAyah={currentAyah}
            storageMode={storageMode}
            onNavigate={navigate}
          />
        )}

        {/* Placeholder screens */}
        {["profile", "dedup", "glossika"].includes(screen) && (
          <div className="flex-1 overflow-y-auto p-3.5">
            <div className="text-center py-20">
              <div className="text-[48px] mb-4">
                {screen === "profile" ? "👤" : "🔧"}
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

        <BottomNav activeScreen={screen} onNavigate={navigate} />
      </div>
    </div>
  );
}
