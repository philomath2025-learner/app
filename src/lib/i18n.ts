/**
 * Language System — Per spec Section 7
 *
 * T() — UI strings (ALWAYS English)
 * C() — Content strings (language-dependent)
 * W() — Multilingual field reader
 */

import type { LangCode } from "./constants";

// UI strings — ALWAYS English (Rule 3)
const UI_STRINGS: Record<string, string> = {
  home: "Home",
  map: "Juz Map",
  review: "Review",
  lesson: "Lesson",
  ledger: "Vocabulary",
  settings: "Settings",
  profile: "Profile",
  startLesson: "Start Lesson",
  continueLesson: "Continue Lesson",
  markLearned: "✓ Mark Learned",
  glossikaMode: "🔁 Glossika Mode",
  backHome: "Back to Home",
  reviewAgain: "Review Again",
  xpEarned: "XP earned",
  dayStreak: "day streak",
  newWord: "new",
  reinforce: "reinforce",
  particle: "particle",
  again: "Again",
  hard: "Hard",
  good: "Good",
  easy: "Easy",
  levelUpTitle: "Level Up!",
  levelUpDesc: "You reached a new level in your Quran journey!",
  dailyGoal: "Daily Goal",
  wordsLearned: "Words Learned",
  totalXP: "Total XP",
  league: "League",
  dueForReview: "Due for review",
  nextNewWords: "Next — new words",
  searchPlaceholder: "Search roots…",
  language: "Content Language",
  reviewLimit: "Daily review limit",
  newWordsLimit: "New words per session",
  recallMeaning: "🃏 Recall the meaning",
  tapToReveal: "▼ tap to reveal",
  showAnswer: "👁 Show Answer",
  howWell: "How well did you know this?",
  reviewComplete: "Review Complete!",
  browseAllLanguages: "Browse All Languages",
  searchLanguages: "Search languages…",
  translationEdition: "Translation Edition",
};

/** UI strings — always English */
export function T(key: string): string {
  return UI_STRINGS[key] || key;
}

// Content string templates — English default, with optional overrides
const CONTENT_STRINGS: Record<string, Record<string, string>> = {
  en: {
    tafsirLabel: "Tafsir (Ibn Kathir)",
    morphologyLabel: "Morphology",
    rootLabel: "Root",
    frequencyLabel: "Frequency",
    posLabel: "Part of Speech",
  },
  ta: {
    tafsirLabel: "தப்ஸீர் (இப்னு கதீர்)",
    morphologyLabel: "உருபியல்",
    rootLabel: "வேர்",
    frequencyLabel: "அதிர்வெண்",
    posLabel: "சொல் வகை",
  },
};

/** Content strings — language-dependent, falls back to English */
export function C(key: string, lang: LangCode): string {
  return CONTENT_STRINGS[lang]?.[key] || CONTENT_STRINGS.en[key] || key;
}

/** Read multilingual field like { en: "mercy", ta: "கருணை" } */
export function W(
  obj: Record<string, unknown>,
  field: string,
  lang: LangCode = "en"
): string {
  const val = obj[field];
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object" && val !== null) {
    const multi = val as Record<string, string>;
    return multi[lang] || multi.en || "";
  }
  return String(val);
}
