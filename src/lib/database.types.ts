/**
 * Supabase Database Types — Auto-generated from schema
 *
 * Provides full TypeScript type safety for all 7 tables.
 * Regenerate with: npx supabase gen types typescript --project-id xzaispiajzcwimshhoob
 */

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          auth_id: string;
          display_name: string;
          display_initial: string;
          language: "en" | "ta";
          review_limit: number;
          new_words_limit: number;
          qf_access_token: string | null;
          qf_refresh_token: string | null;
          qf_token_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_id: string;
          display_name?: string;
          display_initial?: string;
          language?: "en" | "ta";
          review_limit?: number;
          new_words_limit?: number;
          qf_access_token?: string | null;
          qf_refresh_token?: string | null;
          qf_token_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_id?: string;
          display_name?: string;
          display_initial?: string;
          language?: "en" | "ta";
          review_limit?: number;
          new_words_limit?: number;
          qf_access_token?: string | null;
          qf_refresh_token?: string | null;
          qf_token_expires_at?: string | null;
          updated_at?: string;
        };
      };

      user_progress: {
        Row: {
          id: string;
          user_id: string;
          current_ayah: string;
          current_juz: number;
          xp: number;
          level_name: string;
          hearts: number;
          hearts_refill_at: string | null;
          streak_days: number;
          streak_last_date: string | null;
          total_words_learned: number;
          total_roots_learned: number;
          total_reviews: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          current_ayah?: string;
          current_juz?: number;
          xp?: number;
          level_name?: string;
          hearts?: number;
          hearts_refill_at?: string | null;
          streak_days?: number;
          streak_last_date?: string | null;
          total_words_learned?: number;
          total_roots_learned?: number;
          total_reviews?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          current_ayah?: string;
          current_juz?: number;
          xp?: number;
          level_name?: string;
          hearts?: number;
          hearts_refill_at?: string | null;
          streak_days?: number;
          streak_last_date?: string | null;
          total_words_learned?: number;
          total_roots_learned?: number;
          total_reviews?: number;
          updated_at?: string;
        };
      };

      daily_goals: {
        Row: {
          id: string;
          user_id: string;
          goal_date: string;
          target_reviews: number;
          completed_reviews: number;
          target_new_words: number;
          completed_new_words: number;
          xp_earned: number;
          completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          goal_date?: string;
          target_reviews?: number;
          completed_reviews?: number;
          target_new_words?: number;
          completed_new_words?: number;
          xp_earned?: number;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          goal_date?: string;
          target_reviews?: number;
          completed_reviews?: number;
          target_new_words?: number;
          completed_new_words?: number;
          xp_earned?: number;
          completed?: boolean;
          updated_at?: string;
        };
      };

      vocabulary_ledger: {
        Row: {
          id: string;
          user_id: string;
          root: string;
          first_surface_form: string;
          first_ayah_key: string;
          pos: string;
          meaning_cluster: string | null;
          translation_en: string | null;
          translation_ta: string | null;
          lemma: string | null;
          frequency_root: number;
          srs_interval: number;
          srs_ease_factor: number;
          srs_repetitions: number;
          srs_next_review: string;
          srs_last_review: string | null;
          learned_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          root: string;
          first_surface_form: string;
          first_ayah_key: string;
          pos: string;
          meaning_cluster?: string | null;
          translation_en?: string | null;
          translation_ta?: string | null;
          lemma?: string | null;
          frequency_root?: number;
          srs_interval?: number;
          srs_ease_factor?: number;
          srs_repetitions?: number;
          srs_next_review?: string;
          srs_last_review?: string | null;
          learned_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          root?: string;
          first_surface_form?: string;
          first_ayah_key?: string;
          pos?: string;
          meaning_cluster?: string | null;
          translation_en?: string | null;
          translation_ta?: string | null;
          lemma?: string | null;
          frequency_root?: number;
          srs_interval?: number;
          srs_ease_factor?: number;
          srs_repetitions?: number;
          srs_next_review?: string;
          srs_last_review?: string | null;
          updated_at?: string;
        };
      };

      vocabulary_decisions: {
        Row: {
          id: string;
          user_id: string;
          ayah_key: string;
          word_position: number;
          arabic: string;
          root: string | null;
          dedup_level: number;
          verdict: "new" | "reinforce" | "particle";
          reason: string | null;
          xp_awarded: number;
          decided_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ayah_key: string;
          word_position: number;
          arabic: string;
          root?: string | null;
          dedup_level: number;
          verdict: "new" | "reinforce" | "particle";
          reason?: string | null;
          xp_awarded?: number;
          decided_at?: string;
        };
        Update: {
          // Decisions are permanent (Rule 4) — only insert, never update
        };
      };

      srs_reviews: {
        Row: {
          id: string;
          user_id: string;
          ledger_id: string;
          rating: "again" | "hard" | "good" | "easy";
          prev_interval: number;
          new_interval: number;
          prev_ease: number;
          new_ease: number;
          xp_awarded: number;
          reviewed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ledger_id: string;
          rating: "again" | "hard" | "good" | "easy";
          prev_interval: number;
          new_interval: number;
          prev_ease: number;
          new_ease: number;
          xp_awarded?: number;
          reviewed_at?: string;
        };
        Update: {
          // Reviews are append-only — never updated
        };
      };

      mcp_cache: {
        Row: {
          id: string;
          cache_key: string;
          tool_name: string;
          response: Record<string, unknown>;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          cache_key: string;
          tool_name: string;
          response: Record<string, unknown>;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          response?: Record<string, unknown>;
          expires_at?: string;
        };
      };
    };
  };
}
