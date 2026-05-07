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
export const LANGUAGES = {
  en: {
    code: "en",
    label: "English",
    flag: "🇬🇧",
    mcpTranslationEdition: "en-abdel-haleem",
    mcpTafsirEdition: "en-tafsir-ibn-kathir",
  },
  ta: {
    code: "ta",
    label: "தமிழ்",
    flag: "🇮🇳",
    mcpTranslationEdition: "ta-tamil",
    mcpTafsirEdition: "en-tafsir-ibn-kathir",
  },
} as const;

export type LangCode = keyof typeof LANGUAGES;

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
