// ── Levels ──
export const LEVELS = [
  { name: "Mubtadi", emoji: "📖", minXP: 0 },
  { name: "Talib", emoji: "🔍", minXP: 100 },
  { name: "Darasa", emoji: "✍️", minXP: 200 },
  { name: "Muta'allim", emoji: "📚", minXP: 300 },
  { name: "Faqih", emoji: "🌙", minXP: 500 },
  { name: "Hafidh", emoji: "⭐", minXP: 750 },
  { name: "'Alim", emoji: "🕌", minXP: 1000 },
  { name: "Ustadh", emoji: "🎓", minXP: 1500 },
  { name: "Sheikh", emoji: "🌿", minXP: 2500 },
  { name: "Hakim", emoji: "✨", minXP: 5000 },
] as const;

export function getLevel(xp: number) {
  let lv: (typeof LEVELS)[number] = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.minXP) lv = l;
  return lv;
}

export function getNextLevel(xp: number) {
  for (const l of LEVELS) if (l.minXP > xp) return l;
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
  scopes: "openid offline_access user streak goal bookmark reading_session preference",
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
  { id: "map", icon: "🗺", label: "Juz Map" },
  { id: "quiz", icon: "🃏", label: "Review" },
  { id: "lesson", icon: "📖", label: "Lesson" },
  { id: "ledger", icon: "📚", label: "Ledger" },
  { id: "settings", icon: "⚙️", label: "Settings" },
] as const;

export type ScreenId = (typeof NAV_ITEMS)[number]["id"] | "profile" | "dedup" | "glossika";
