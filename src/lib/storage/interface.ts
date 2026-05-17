export interface LearnedWord {
  ayahKey: string;
  position: number;
  arabic: string;
  root: string;
  lemma: string;
  pos: string;
  translation: string;
  frequencyRoot?: number;
}

export interface ReviewCard {
  id: string; // the root or ledger id
  arabic: string; // first_surface_form
  root: string;
  meaning: string;
  ayah: string; // full Arabic ayah text
  ayahTranslation: string; // English translation of full ayah
  ayahWords: { arabic: string; translation: string }[]; // word-by-word for highlighting
  ref: string; // ayah_key
  hint: string;
  xp: number;
  srs_interval?: number;
  srs_repetitions?: number;
  srs_ease_factor?: number;
}

export interface VocabularyLedgerEntry {
  id?: string;
  user_id?: string;
  root: string;
  lemma: string;
  pos: string;
  status: "new" | "known" | "reinforce";
  // DB uses first_seen_ayah (local) and first_ayah_key (cloud) — support both
  first_seen_ayah?: string;
  first_ayah_key?: string;
  first_surface_form?: string;
  learned_at: string;
  translation_en?: string | null;
  meaning_cluster?: string;
  // SRS Fields (SM-2) — both naming conventions for compatibility
  srs_interval?: number;
  srs_repetitions?: number;
  srs_ease_factor?: number;
  srs_next_review?: string;
  srs_last_review?: string;
  // Local IndexedDB naming aliases
  interval?: number;
  repetition?: number;
  ease_factor?: number;
  next_review?: string;
  frequency_root?: number;
}

export interface VocabularyDecision {
  ayah_key: string;
  word_position: number;
  arabic: string;
  root: string | null;
  dedup_level: number;
  rule?: string;
  verdict: "NEW" | "new" | "reinforce" | "particle" | "skip";
  reason: string | null;
  xp_awarded: number;
  decided_at: string;
}

export interface StorageProvider {
  /** Check if the provider is initialized/ready */
  init(): Promise<void>;
  
  /** Get all roots the user has learned */
  getKnownRoots(): Promise<Map<string, VocabularyLedgerEntry>>;
  
  /** Mark a word as learned and update XP */
  markWordLearned(word: LearnedWord): Promise<void>;
  
  /** Save deduplication decisions for an entire Ayah */
  saveDecisions(decisions: VocabularyDecision[]): Promise<void>;

  /** Get the deduplication audit trail */
  getDecisions(): Promise<VocabularyDecision[]>;
  
  /** Update user XP */
  updateXP(amount: number): Promise<void>;
  
  /** Get total XP */
  getXP(): Promise<number>;

  /** Get hearts state */
  getHearts(): Promise<{ count: number; lastRefill: string }>;

  /** Save hearts state */
  saveHearts(count: number, lastRefill: string): Promise<void>;

  /** Get current reading position (Ayah Key) */
  getCurrentAyah(): Promise<string>;

  /** Save current reading position */
  saveCurrentAyah(ayahKey: string): Promise<void>;

  /** Get daily goal progress for today */
  getDailyGoal(): Promise<{ xp_earned: number; completed: boolean }>;

  /** Get activity history for the past N days */
  getActivityHistory(days: number): Promise<{ date: string; xp_earned: number }[]>;

  /** Update daily goal progress */
  updateDailyGoal(xp_earned: number, completed?: boolean): Promise<void>;

  /** Get words due for review */
  getDueReviews(limit?: number): Promise<ReviewCard[]>;

  /** Submit SM-2 review rating */
  submitReview(root: string, rating: "again" | "hard" | "good" | "easy", timeSpentSeconds?: number): Promise<void>;

  /** Get user preferences */
  getLocalPreferences(): Promise<{ lang: string; translationId: number | null; tafsirId: number | null; theme: "light" | "dark"; reviewLimit: number; newWordsLimit: number; }>;

  /** Save user preferences */
  saveLocalPreferences(prefs: Partial<{ lang: string; translationId: number | null; tafsirId: number | null; theme: "light" | "dark"; reviewLimit: number; newWordsLimit: number; }>): Promise<void>;

  /**
   * Fully resets the user's progress.
   * Useful for development/testing or user hard reset.
   */
  clearAllProgress(): Promise<void>;
}
