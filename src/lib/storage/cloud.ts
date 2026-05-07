import { StorageProvider, VocabularyLedgerEntry, LearnedWord, ReviewCard } from "./interface";

export class CloudStorageProvider implements StorageProvider {
  async init(): Promise<void> {
    // Cloud provider doesn't need local initialization
    return;
  }

  async getKnownRoots(): Promise<Map<string, VocabularyLedgerEntry>> {
    try {
      const res = await fetch("/api/lesson/ledger");
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

  async updateXP(amount: number): Promise<void> {
    // Supabase backend will calculate total XP, but we can hit an endpoint
    // to manually add if necessary, or let markWordLearned handle it.
    // For now, let's just make a dedicated XP endpoint if needed, or ignore.
    return;
  }

  async getXP(): Promise<number> {
    try {
      const res = await fetch("/api/user/progress");
      if (!res.ok) return 0;
      const data = await res.json();
      return data.xp || 0;
    } catch (err) {
      return 0;
    }
  }

  async getCurrentAyah(): Promise<string> {
    try {
      const res = await fetch("/api/user/progress");
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

  async getDueReviews(limit: number = 20): Promise<ReviewCard[]> {
    try {
      const res = await fetch(`/api/review/due?limit=${limit}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.cards || [];
    } catch (err) {
      console.error("Failed to fetch due reviews from cloud:", err);
      return [];
    }
  }

  async submitReview(root: string, rating: "again" | "hard" | "good" | "easy"): Promise<void> {
    try {
      await fetch("/api/review/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ root, rating }),
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
}
