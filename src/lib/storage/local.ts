import { StorageProvider, LearnedWord, VocabularyLedgerEntry, ReviewCard } from "./interface";
import { calculateSM2, ReviewRating, addDays } from "../srs";

const DB_NAME = "QuranLingoDB";
const STORE_NAME = "vocabulary_ledger";
const DB_VERSION = 1;

export class LocalStorageProvider implements StorageProvider {
  private db: IDBDatabase | null = null;
  private xp: number = 0;

  async init(): Promise<void> {
    if (typeof window === "undefined") return;

    // Load XP from localStorage for simplicity
    const savedXp = localStorage.getItem("quranlingo_xp");
    if (savedXp) this.xp = parseInt(savedXp, 10);

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "root" });
        }
      };
    });
  }

  async getKnownRoots(): Promise<Map<string, VocabularyLedgerEntry>> {
    if (!this.db) await this.init();
    if (!this.db) return new Map();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const map = new Map<string, VocabularyLedgerEntry>();
        request.result.forEach((entry: VocabularyLedgerEntry) => {
          map.set(entry.root, entry);
        });
        resolve(map);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async markWordLearned(word: LearnedWord): Promise<void> {
    try {
      if (!this.db) await this.init();
      if (!this.db) return;

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const entry = {
          root: word.root,
          first_surface_form: word.arabic,
          first_ayah_key: word.ayahKey,
          first_seen_ayah: word.ayahKey,
          pos: word.pos,
          meaning_cluster: "default",
          lemma: word.lemma,
          status: "known",
          srs_interval: 1,
          srs_repetitions: 1,
          srs_ease_factor: 2.5,
          srs_next_review: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          learned_at: new Date().toISOString(),
          translation_en: word.translation || null,
          frequency_root: word.frequencyRoot || 0,
        };
        
        console.log("Saving to IndexedDB:", entry);
        const request = store.put(entry);
        
        request.onsuccess = () => {
          console.log("Successfully saved to IndexedDB");
          resolve();
        };
        request.onerror = () => {
          console.error("IndexedDB save error:", request.error);
          reject(request.error);
        };
      });
    } catch (err) {
      console.error("LocalStorageProvider error:", err);
    }
  }

  async updateXP(amount: number): Promise<void> {
    this.xp += amount;
    if (typeof window !== "undefined") {
      localStorage.setItem("quranlingo_xp", this.xp.toString());
    }
  }

  async getXP(): Promise<number> {
    if (typeof window !== "undefined") {
      const savedXp = localStorage.getItem("quranlingo_xp");
      if (savedXp) return parseInt(savedXp, 10);
    }
    return this.xp;
  }

  async getHearts(): Promise<{ count: number; lastRefill: string }> {
    if (typeof window !== "undefined") {
      const count = localStorage.getItem("quranlingo_hearts");
      const lastRefill = localStorage.getItem("quranlingo_last_refill");
      return {
        count: count ? parseInt(count, 10) : 5,
        lastRefill: lastRefill || new Date().toISOString()
      };
    }
    return { count: 5, lastRefill: new Date().toISOString() };
  }

  async saveHearts(count: number, lastRefill: string): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.setItem("quranlingo_hearts", count.toString());
      localStorage.setItem("quranlingo_last_refill", lastRefill);
    }
  }

  async getCurrentAyah(): Promise<string> {
    if (typeof window !== "undefined") {
      const savedAyah = localStorage.getItem("quranlingo_current_ayah");
      if (savedAyah) return savedAyah;
    }
    return "1:1";
  }

  async saveCurrentAyah(ayahKey: string): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.setItem("quranlingo_current_ayah", ayahKey);
    }
  }

  async getDailyGoal(): Promise<{ xp_earned: number; completed: boolean }> {
    if (typeof window !== "undefined") {
      const today = new Date().toISOString().split('T')[0];
      const data = localStorage.getItem(`quranlingo_goal_${today}`);
      if (data) return JSON.parse(data);
    }
    return { xp_earned: 0, completed: false };
  }

  async updateDailyGoal(xp: number, completed: boolean = false): Promise<void> {
    if (typeof window !== "undefined") {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(`quranlingo_goal_${today}`, JSON.stringify({ xp_earned: xp, completed }));
    }
  }

  async getDueReviews(limit: number = 20): Promise<ReviewCard[]> {
    if (!this.db) await this.init();
    if (!this.db) return [];

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const entries: VocabularyLedgerEntry[] = request.result;
        const today = new Date().toISOString().split('T')[0];
        
        const dueEntries = entries.filter(e => (e.srs_next_review || e.next_review || "") <= today).slice(0, limit);
        let cardsToReview = dueEntries;

        if (cardsToReview.length === 0) {
          cardsToReview = entries.slice(0, 5);
        }

        const cards: ReviewCard[] = cardsToReview.map(e => ({
          id: e.root,
          arabic: e.first_surface_form || e.lemma,
          root: e.root,
          meaning: e.translation_en || "Meaning unavailable",
          ayah: "",
          ayahTranslation: "",
          ayahWords: [],
          ref: e.first_ayah_key || e.first_seen_ayah || "",
          hint: e.pos,
          xp: 10,
        }));
        
        resolve(cards);
      };
      
      request.onerror = () => resolve([]);
    });
  }

  async submitReview(root: string, rating: "again" | "hard" | "good" | "easy"): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(root);

      request.onsuccess = () => {
        const entry = request.result;
        if (entry) {
          const sm2 = calculateSM2(rating, entry.srs_interval || entry.interval || 1, entry.srs_repetitions || entry.repetition || 1, entry.srs_ease_factor || entry.ease_factor || 2.5);
          
          entry.srs_interval = sm2.interval;
          entry.srs_repetitions = sm2.repetition;
          entry.srs_ease_factor = sm2.easeFactor;
          entry.srs_next_review = addDays(new Date(), sm2.interval).toISOString().split('T')[0];
          
          store.put(entry);
          
          if (rating !== "again") {
            this.updateXP(5);
          }
        }
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllProgress(): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      
      store.clear();

      transaction.oncomplete = () => {
        this.xp = 0;
        if (typeof window !== "undefined") {
          localStorage.removeItem("quranlingo_xp");
          localStorage.removeItem("quranlingo_current_ayah");
        }
        resolve();
      };
      
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getLocalPreferences(): Promise<{ lang: string; translationId: number | null; tafsirId: number | null; theme: "light" | "dark"; reviewLimit: number; newWordsLimit: number; }> {
    const defaults = { lang: "en", translationId: 131, tafsirId: 169, theme: "light" as const, reviewLimit: 20, newWordsLimit: 10 };
    if (typeof window !== "undefined") {
      const data = localStorage.getItem("quranlingo_prefs");
      if (data) {
        try {
          return { ...defaults, ...JSON.parse(data) };
        } catch (e) {
          console.error("Failed to parse local preferences", e);
        }
      }
    }
    return defaults;
  }

  async saveLocalPreferences(prefs: Partial<{ lang: string; translationId: number | null; tafsirId: number | null; theme: "light" | "dark"; reviewLimit: number; newWordsLimit: number; }>): Promise<void> {
    if (typeof window !== "undefined") {
      const current = await this.getLocalPreferences();
      localStorage.setItem("quranlingo_prefs", JSON.stringify({ ...current, ...prefs }));
    }
  }
}
