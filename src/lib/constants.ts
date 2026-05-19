export const SURAH_VERSE_COUNTS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];

export function getAbsoluteAyah(ayahKey: string): number {
  if (!ayahKey || !ayahKey.includes(":")) return 0;
  const [surah, ayah] = ayahKey.split(":").map(Number);
  if (isNaN(surah) || isNaN(ayah) || surah < 1 || surah > 114) return 0;
  
  let absolute = 0;
  for (let i = 0; i < surah - 1; i++) {
    absolute += SURAH_VERSE_COUNTS[i];
  }
  absolute += ayah;
  // Make sure we don't exceed the max (some verses might be slightly off in numbering systems, cap at 6236)
  return Math.min(absolute, 6236);
}

// ── Levels ──
export const LEVELS = [
  { name: "Mubtadi (Beginner)", emoji: "📖", minAyahs: 0, desc: "First steps, approachable start" },
  { name: "Talib (Seeker)", emoji: "🔍", minAyahs: 50, desc: "Steady progress, curiosity-driven" },
  { name: "Darasa (Studious)", emoji: "✍️", minAyahs: 200, desc: "Consistent study and revision" },
  { name: "Muta'allim (Dedicated Learner)", emoji: "📚", minAyahs: 500, desc: "Building a solid foundation" },
  { name: "Faqih (Discerner)", emoji: "🌙", minAyahs: 1000, desc: "Deeper contextual understanding" },
  { name: "Hafidh (Preserver)", emoji: "⭐", minAyahs: 1750, desc: "Major memorization milestone" },
  { name: "'Alim (Scholar)", emoji: "🕌", minAyahs: 2750, desc: "Personal mastery of meanings" },
  { name: "Ustadh (Teacher)", emoji: "🎓", minAyahs: 4000, desc: "Guiding others, transmitting knowledge" },
  { name: "Sheikh (Mentor)", emoji: "🌿", minAyahs: 5500, desc: "Seasoned, nearing completion" },
  { name: "Hakim (Sage)", emoji: "✨", minAyahs: 6000, desc: "Ultimate mastery, completion of Qur'an" },
] as const;

export function getLevel(ayahs: number) {
  let lv: (typeof LEVELS)[number] = LEVELS[0];
  for (const l of LEVELS) if (ayahs >= l.minAyahs) lv = l;
  return lv;
}

export function getNextLevel(ayahs: number) {
  for (const l of LEVELS) if (l.minAyahs > ayahs) return l;
  return null;
}

// ── Languages ──

/** Any QF-supported ISO language code */
export type LangCode = string;

/** Default language */
export const DEFAULT_LANG: LangCode = "en";

/**
 * Popular languages for the quick-pick UI in Settings.
 * The full list of 70+ languages is fetched dynamically from QF API.
 */
export const POPULAR_LANGUAGES: {
  code: LangCode;
  label: string;
  nativeLabel: string;
  flag: string;
  direction: "ltr" | "rtl";
}[] = [
  { code: "en", label: "English", nativeLabel: "English", flag: "🇬🇧", direction: "ltr" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்", flag: "🇮🇳", direction: "ltr" },
  { code: "ur", label: "Urdu", nativeLabel: "اردو", flag: "🇵🇰", direction: "rtl" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা", flag: "🇧🇩", direction: "ltr" },
  { code: "fr", label: "French", nativeLabel: "Français", flag: "🇫🇷", direction: "ltr" },
  { code: "tr", label: "Turkish", nativeLabel: "Türkçe", flag: "🇹🇷", direction: "ltr" },
  { code: "id", label: "Indonesian", nativeLabel: "Bahasa Indonesia", flag: "🇮🇩", direction: "ltr" },
  { code: "ms", label: "Malay", nativeLabel: "Bahasa Melayu", flag: "🇲🇾", direction: "ltr" },
  { code: "ru", label: "Russian", nativeLabel: "Русский", flag: "🇷🇺", direction: "ltr" },
  { code: "es", label: "Spanish", nativeLabel: "Español", flag: "🇪🇸", direction: "ltr" },
  { code: "de", label: "German", nativeLabel: "Deutsch", flag: "🇩🇪", direction: "ltr" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", flag: "🇮🇳", direction: "ltr" },
  { code: "ml", label: "Malayalam", nativeLabel: "മലയാളം", flag: "🇮🇳", direction: "ltr" },
];

/**
 * @deprecated Use POPULAR_LANGUAGES and dynamic QF API instead.
 * Kept for backward compatibility during migration.
 */
export const LANGUAGES: Record<string, { code: string; label: string; flag: string }> = {
  en: { code: "en", label: "English", flag: "🇬🇧" },
  ta: { code: "ta", label: "தமிழ்", flag: "🇮🇳" },
};

// ── OAuth2 Config ──
export const QF_OAUTH = {
  clientId: "1d0597e2-35ee-4f60-a594-f44c73fa29bf",
  authEndpoint: "https://oauth2.quran.foundation",
  apiBase: "https://apis.quran.foundation/auth/v1",
  scopes: "openid profile email offline_access user streak goal bookmark reading_session preference",
} as const;

// ── MCP Config ──
export const MCP_SERVER = {
  type: "url" as const,
  url: "https://mcp.quran.ai",
  name: "quran-mcp",
};
export const ANTHROPIC_MODEL = "claude-sonnet-4-20250514";

// ── Nav Items ──
export const NAV_ITEMS = [
  { id: "home", icon: "🏠", label: "Home" },
  { id: "map", icon: "🛤️", label: "Learning Path" },
  { id: "quiz", icon: "🧠", label: "Review" },
  { id: "lesson", icon: "📖", label: "Lesson" },
  { id: "rooms", icon: "👥", label: "Rooms" },
  { id: "ledger", icon: "📚", label: "Ledger" },
  { id: "settings", icon: "⚙️", label: "Settings" },
] as const;

export type ScreenId = (typeof NAV_ITEMS)[number]["id"] | "profile" | "dedup" | "glossika" | "surah-picker";
