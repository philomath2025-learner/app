/**
 * Quran Foundation Language & Resource Registry
 *
 * Fetches and caches the list of supported languages, translation editions,
 * and tafsir editions from the QF Content API. Provides helpers to resolve
 * the best translation/tafsir ID for any language code.
 *
 * Cache TTL: 24 hours (these lists rarely change).
 */

const QF_CONTENT_API = "https://api.quran.com/api/v4";

// ── Types ──

export interface QFLanguage {
  id: number;
  name: string;
  iso_code: string;
  native_name: string;
  direction: "ltr" | "rtl";
  translations_count: number;
  translated_name: { name: string; language_name: string };
}

export interface QFTranslationResource {
  id: number;
  name: string;
  author_name: string;
  slug: string | null;
  language_name: string;
  translated_name: { name: string; language_name: string };
}

export interface QFTafsirResource {
  id: number;
  name: string;
  author_name: string;
  slug: string | null;
  language_name: string;
  translated_name: { name: string; language_name: string };
}

// ── Cache ──

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

let languagesCache: CacheEntry<QFLanguage[]> | null = null;
const translationsCache = new Map<string, CacheEntry<QFTranslationResource[]>>();
const tafsirsCache = new Map<string, CacheEntry<QFTafsirResource[]>>();

function isFresh<T>(entry: CacheEntry<T> | null | undefined): entry is CacheEntry<T> {
  return !!entry && Date.now() < entry.expiresAt;
}

// ── Fetchers ──

/** Fetch all QF-supported languages */
export async function fetchQFLanguages(): Promise<QFLanguage[]> {
  if (isFresh(languagesCache)) return languagesCache.data;

  const res = await fetch(`${QF_CONTENT_API}/resources/languages`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`QF languages API failed: ${res.status}`);

  const data = await res.json();
  const languages: QFLanguage[] = data.languages || [];

  languagesCache = { data: languages, expiresAt: Date.now() + CACHE_TTL };
  return languages;
}

/** Fetch available translation editions for a specific language */
export async function fetchQFTranslations(langIso: string): Promise<QFTranslationResource[]> {
  const cached = translationsCache.get(langIso);
  if (isFresh(cached)) return cached.data;

  const res = await fetch(`${QF_CONTENT_API}/resources/translations?language=${langIso}`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`QF translations API failed for ${langIso}: ${res.status}`);

  const data = await res.json();
  const translations: QFTranslationResource[] = data.translations || [];

  // Filter to only translations matching this language
  const filtered = translations.filter((t) => {
    const tLang = t.language_name?.toLowerCase() || "";
    // Precision match using our ISO mapping
    return isLanguageMatch(langIso, tLang);
  });

  // If filtering yielded nothing, use what the API returned
  const result = filtered.length > 0 ? filtered : translations;

  translationsCache.set(langIso, { data: result, expiresAt: Date.now() + CACHE_TTL });
  return result;
}

/** Fetch available tafsir editions for a specific language */
export async function fetchQFTafsirs(langIso: string): Promise<QFTafsirResource[]> {
  const cached = tafsirsCache.get(langIso);
  if (isFresh(cached)) return cached.data;

  const res = await fetch(`${QF_CONTENT_API}/resources/tafsirs?language=${langIso}`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`QF tafsirs API failed for ${langIso}: ${res.status}`);

  const data = await res.json();
  const tafsirs: QFTafsirResource[] = data.tafsirs || [];

  // Filter to only tafsirs matching this language
  const filtered = tafsirs.filter((t) => {
    const tLang = t.language_name?.toLowerCase() || "";
    return isLanguageMatch(langIso, tLang);
  });

  const result = filtered.length > 0 ? filtered : tafsirs;

  tafsirsCache.set(langIso, { data: result, expiresAt: Date.now() + CACHE_TTL });
  return result;
}

// ── Resolvers ──

/** Well-known "best" translation IDs per language (curated defaults) */
const PREFERRED_TRANSLATIONS: Record<string, number> = {
  en: 131,   // Dr. Mustafa Khattab (The Clear Quran)
  ta: 229,   // Sheikh Omar Sharif bin Abdul Salam
  ur: 234,   // Fatah Muhammad Jalandhari
  fr: 136,   // Montada Islamic Foundation
  bn: 161,   // Taisirul Quran
  tr: 77,    // Diyanet
  id: 33,    // Indonesian Islamic Affairs Ministry
  ru: 45,    // Elmir Kuliev
  es: 83,    // Sheikh Isa Garcia
  de: 27,    // Frank Bubenheim and Nadeem
  ml: 37,    // Abdul Hameed and Kunhi
  hi: 122,   // Maulana Azizul Haque al-Umari
  ja: 35,    // Ryoichi Mita
  ko: 36,    // Korean
  zh: 56,    // Ma Jian (Simplified)
  pt: 103,   // Helmi Nasr
  it: 153,   // Hamza Roberto Piccardo
  nl: 235,   // Malak Faris Abdalsalaam
  bs: 25,    // Muhamed Mehanović
  ms: 39,    // Abdullah Muhammad Basmeih
  sw: 231,   // Dr. Abdullah Muhammad Abu Bakr
  fa: 135,   // IslamHouse.com
  ps: 118,   // Zakaria Abulsalam
};

/** English fallback translation */
const FALLBACK_TRANSLATION_ID = 131; // The Clear Quran (English)

/** English fallback tafsir */
const FALLBACK_TAFSIR_ID = 169; // Ibn Kathir (English)

/**
 * Get the best translation ID for a language.
 * Falls back to English if no translation exists for the language.
 */
export async function getDefaultTranslationId(langIso: string): Promise<number> {
  // Check curated defaults first
  if (PREFERRED_TRANSLATIONS[langIso]) {
    return PREFERRED_TRANSLATIONS[langIso];
  }

  // Try to fetch translations for this language
  try {
    const translations = await fetchQFTranslations(langIso);
    if (translations.length > 0) {
      return translations[0].id;
    }
  } catch {
    // Fall through to English default
  }

  return FALLBACK_TRANSLATION_ID;
}

/**
 * Get the best tafsir ID for a language.
 * Falls back to English Ibn Kathir if no tafsir exists for the language.
 */
export async function getDefaultTafsirId(langIso: string): Promise<number> {
  // Try to fetch tafsirs for this language
  try {
    const tafsirs = await fetchQFTafsirs(langIso);
    // Find a tafsir matching this language
    const langLower = langIso.toLowerCase();
    const match = tafsirs.find((t) => {
      const tLang = t.language_name?.toLowerCase() || "";
      return tLang.includes(langLower) || isLanguageMatch(langIso, tLang);
    });
    if (match) return match.id;
  } catch {
    // Fall through to English default
  }

  return FALLBACK_TAFSIR_ID;
}

// ── Helpers ──

/** Map ISO codes to language name fragments for matching */
const ISO_TO_NAME: Record<string, string> = {
  en: "english", ta: "tamil", ur: "urdu", fr: "french", bn: "bengali",
  tr: "turkish", id: "indonesian", ru: "russian", es: "spanish", de: "german",
  ml: "malayalam", hi: "hindi", ja: "japanese", ko: "korean", zh: "chinese",
  pt: "portuguese", it: "italian", nl: "dutch", bs: "bosnian", ms: "malay",
  sw: "swahili", fa: "persian", ps: "pashto", ar: "arabic", sq: "albanian",
  az: "azeri", bg: "bulgarian", cs: "czech", fi: "finnish", gu: "gujarati",
  ha: "hausa", he: "hebrew", ka: "georgian", kk: "kazakh", km: "khmer",
  ku: "kurdish", mk: "macedonian", mr: "marathi", ne: "nepali", no: "norwegian",
  pl: "polish", ro: "romanian", so: "somali", sv: "swedish", te: "telugu",
  th: "thai", tl: "tagalog", uk: "ukrainian", uz: "uzbek", vi: "vietnamese",
  yo: "yoruba", tg: "tajik", si: "sinhala", sr: "serbian",
};

function isLanguageMatch(isoCode: string, languageName: string): boolean {
  const expected = ISO_TO_NAME[isoCode];
  if (!expected) return false;
  return languageName.includes(expected);
}
