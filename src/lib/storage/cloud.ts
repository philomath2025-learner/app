import { StorageProvider, VocabularyLedgerEntry, LearnedWord, ReviewCard } from "./interface";

export class CloudStorageProvider implements StorageProvider {
  async init(): Promise<void> {
    // Cloud provider doesn't need local initialization
    return;
  }

  async getKnownRoots(): Promise<Map<string, VocabularyLedgerEntry>> {
    try {
      const res = await fetch("/api/lesson/ledger", { cache: "no-store" });
      if (!res.ok) return new Map();
      const data = await res.json();
      
      const map = new Map<string, VocabularyLedgerEntry>();
      data.ledger.forEach((entry: VocabularyLedgerEntry) => {
        map.set(entry.root, entry);
      });
      return map;
    } catch (err) {
      console.error("Failed to fetch cloud ledger:", err);
      return new Map();
    }
  }

  async markWordLearned(word: LearnedWord): Promise<void> {
    try {
      console.log("Sending to cloud:", word);
      const res = await fetch("/api/lesson/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(word),
      });
      const data = await res.json();
      console.log("Cloud save response:", res.status, data);
    } catch (err) {
      console.error("Failed to mark word learned in cloud:", err);
    }
  }

  async saveDecisions(decisions: import("./interface").VocabularyDecision[]): Promise<void> {
    try {
      if (decisions.length === 0) return;
      await fetch("/api/lesson/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisions }),
      });
    } catch (err) {
      console.error("Failed to save decisions to cloud:", err);
    }
  }

  async getDecisions(): Promise<import("./interface").VocabularyDecision[]> {
    try {
      const res = await fetch("/api/lesson/decisions", { cache: "no-store" });
      if (!res.ok) return [];
      const data = await res.json();
      return data.decisions || [];
    } catch (err) {
      console.error("Failed to fetch decisions from cloud:", err);
      return [];
    }
  }

  async updateXP(amount: number): Promise<void> {
    // Supabase backend will calculate total XP, but we can hit an endpoint
    // to manually add if necessary, or let markWordLearned handle it.
    // For now, let's just make a dedicated XP endpoint if needed, or ignore.
    return;
  }

  async getXP(): Promise<number> {
    try {
      const res = await fetch("/api/user/progress", { cache: "no-store" });
      if (!res.ok) return 0;
      const data = await res.json();
      return data.xp || 0;
    } catch (err) {
      return 0;
    }
  }

  async getHearts(): Promise<{ count: number; lastRefill: string }> {
    try {
      const res = await fetch("/api/user/progress", { cache: "no-store" });
      if (!res.ok) return { count: 5, lastRefill: new Date().toISOString() };
      const data = await res.json();
      return {
        count: data.hearts !== undefined ? data.hearts : 5,
        lastRefill: data.hearts_refill_at || new Date().toISOString()
      };
    } catch (err) {
      return { count: 5, lastRefill: new Date().toISOString() };
    }
  }

  async saveHearts(count: number, lastRefill: string): Promise<void> {
    try {
      await fetch("/api/user/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hearts: count, hearts_refill_at: lastRefill }),
      });
    } catch (err) {
      console.error("Failed to save hearts to cloud:", err);
    }
  }

  async getCurrentAyah(): Promise<string> {
    try {
      const res = await fetch("/api/user/progress", { cache: "no-store" });
      if (!res.ok) return "1:1";
      const data = await res.json();
      return data.currentAyah || "1:1";
    } catch (err) {
      return "1:1";
    }
  }

  async saveCurrentAyah(ayahKey: string): Promise<void> {
    try {
      await fetch("/api/user/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentAyah: ayahKey }),
      });
    } catch (err) {
      console.error("Failed to save current ayah to cloud:", err);
    }
  }

  async getDailyGoal(): Promise<{ xp_earned: number; completed: boolean }> {
    try {
      const res = await fetch("/api/user/goal", { cache: "no-store" });
      if (!res.ok) return { xp_earned: 0, completed: false };
      const data = await res.json();
      return { xp_earned: data.xp_earned || 0, completed: !!data.completed };
    } catch {
      return { xp_earned: 0, completed: false };
    }
  }

  async getActivityHistory(days: number): Promise<{ date: string; xp_earned: number }[]> {
    try {
      const res = await fetch(`/api/user/activity?days=${days}`, { cache: "no-store" });
      if (!res.ok) return this._getEmptyHistory(days);
      const data = await res.json();
      return data.history || this._getEmptyHistory(days);
    } catch {
      return this._getEmptyHistory(days);
    }
  }

  private _getEmptyHistory(days: number): { date: string; xp_earned: number }[] {
    const history: { date: string; xp_earned: number }[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      history.push({ date: d.toISOString().split('T')[0], xp_earned: 0 });
    }
    return history;
  }

  async updateDailyGoal(xp: number, completed: boolean = false): Promise<void> {
    try {
      await fetch("/api/user/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xp_earned: xp, completed }),
      });
    } catch (err) {
      console.error("Failed to update daily goal in cloud:", err);
    }
  }

  async getDueReviews(limit: number = 20): Promise<ReviewCard[]> {
    try {
      const res = await fetch(`/api/review/due?limit=${limit}`, { cache: "no-store" });
      if (!res.ok) return [];
      const data = await res.json();
      return data.cards || [];
    } catch (err) {
      console.error("Failed to fetch due reviews from cloud:", err);
      return [];
    }
  }

  async submitReview(root: string, rating: "again" | "hard" | "good" | "easy", timeSpentSeconds?: number): Promise<void> {
    try {
      await fetch("/api/review/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ root, rating, timeSpentSeconds }),
      });
    } catch (err) {
      console.error("Failed to submit review to cloud:", err);
    }
  }

  async clearAllProgress(): Promise<void> {
    try {
      console.log("CloudStorageProvider: calling /api/lesson/reset");
      const res = await fetch("/api/lesson/reset", { method: "POST" });
      const data = await res.json();
      console.log("CloudStorageProvider: reset response", res.status, data);
      if (!res.ok) {
        throw new Error(`Reset failed: ${res.status} - ${JSON.stringify(data)}`);
      }
    } catch (err) {
      console.error("Failed to clear cloud progress:", err);
      throw err; // Re-throw so page.tsx shows the alert
    }
  }

  async getLocalPreferences(): Promise<{ lang: string; translationId: number | null; tafsirId: number | null; theme: "light" | "dark"; reviewLimit: number; newWordsLimit: number; }> {
    const defaults = { lang: "en", translationId: 131, tafsirId: 169, theme: "light" as const, reviewLimit: 20, newWordsLimit: 10 };
    let prefs = { ...defaults };
    
    // 1. Fetch from cloud
    try {
      const res = await fetch("/api/user/preferences", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.preferences) {
          prefs = { ...prefs, ...data.preferences };
        }
      }
    } catch {
      console.error("Failed to fetch cloud preferences");
    }

    // 2. Load theme from localStorage
    if (typeof window !== "undefined") {
      const localData = localStorage.getItem("quranlingo_prefs");
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          if (parsed.theme) prefs.theme = parsed.theme;
        } catch (e) {}
      }
    }

    return prefs;
  }

  async saveLocalPreferences(prefs: Partial<{ lang: string; translationId: number | null; tafsirId: number | null; theme: "light" | "dark"; reviewLimit: number; newWordsLimit: number; }>): Promise<void> {
    // 1. Save theme to local storage
    if (typeof window !== "undefined") {
      const localData = localStorage.getItem("quranlingo_prefs");
      let currentLocal: Record<string, unknown> = {};
      if (localData) {
        try { currentLocal = JSON.parse(localData); } catch {}
      }
      
      const newLocal = { ...currentLocal };
      if (prefs.theme) newLocal.theme = prefs.theme;
      // We can also save everything locally as a fallback
      localStorage.setItem("quranlingo_prefs", JSON.stringify({ ...newLocal, ...prefs }));
    }

    // 2. Save everything else to cloud
    const cloudPrefs = { ...prefs };
    delete cloudPrefs.theme;

    if (Object.keys(cloudPrefs).length > 0) {
      try {
        await fetch("/api/user/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cloudPrefs),
        });
      } catch {
        console.error("Failed to save cloud preferences");
      }
    }
  }
}
