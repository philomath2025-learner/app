/**
 * Quran Foundation Content API Client
 *
 * Base: https://api.quran.com/api/v4
 * Docs: https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/content-apis/
 */

const QF_CONTENT_API = "https://api.quran.com/api/v4";

// ── Types ──

export interface QFWord {
  id: number;
  position: number;
  audio_url: string | null;
  char_type_name: "word" | "end";
  text_uthmani: string;
  text: string;
  translation: { text: string; language_name: string };
  transliteration: { text: string | null; language_name: string };
}

export interface QFVerse {
  id: number;
  verse_number: number;
  verse_key: string;
  hizb_number: number;
  rub_el_hizb_number: number;
  ruku_number: number;
  manzil_number: number;
  text_uthmani: string;
  page_number: number;
  juz_number: number;
  words: QFWord[];
}

export interface QFTranslation {
  id: number;
  resource_id: number;
  text: string;
}

export interface QFVerseWithTranslation extends QFVerse {
  translations?: QFTranslation[];
}

export interface QFChapter {
  id: number;
  revelation_place: string;
  revelation_order: number;
  bismillah_pre: boolean;
  name_simple: string;
  name_complex: string;
  name_arabic: string;
  verses_count: number;
  pages: number[];
  translated_name: { language_name: string; name: string };
}

// ── Translation edition IDs ──
export const TRANSLATION_IDS = {
  en: 131,   // Dr. Mustafa Khattab (The Clear Quran)
  ta: 229,   // Tamil translation
} as const;

// ── API Functions ──

/** Fetch all verses of a chapter with word-by-word data */
export async function fetchVersesByChapter(
  chapterId: number,
  options?: {
    language?: string;
    translationId?: number;
    page?: number;
    perPage?: number;
  }
): Promise<{ verses: QFVerseWithTranslation[]; pagination: { total_pages: number; current_page: number } }> {
  const params = new URLSearchParams({
    language: options?.language || "en",
    words: "true",
    word_fields: "text_uthmani,translation,transliteration",
    fields: "text_uthmani",
    per_page: String(options?.perPage || 50),
    page: String(options?.page || 1),
  });

  if (options?.translationId) {
    params.set("translations", String(options.translationId));
  }

  const res = await fetch(`${QF_CONTENT_API}/verses/by_chapter/${chapterId}?${params}`, {
    next: { revalidate: 86400 }, // Cache for 24h
  });

  if (!res.ok) throw new Error(`QF Content API failed: ${res.status}`);
  return res.json();
}

/** Fetch a single verse by key (e.g., "1:1", "2:255") */
export async function fetchVerseByKey(
  verseKey: string,
  options?: { language?: string; translationId?: number }
): Promise<QFVerseWithTranslation> {
  const params = new URLSearchParams({
    language: options?.language || "en",
    words: "true",
    word_fields: "text_uthmani,translation,transliteration",
    fields: "text_uthmani",
  });

  if (options?.translationId) {
    params.set("translations", String(options.translationId));
  }

  const res = await fetch(`${QF_CONTENT_API}/verses/by_key/${verseKey}?${params}`, {
    next: { revalidate: 86400 },
  });

  if (!res.ok) throw new Error(`QF Content API verse ${verseKey} failed: ${res.status}`);
  const data = await res.json();
  return data.verse;
}

/** Fetch chapter metadata */
export async function fetchChapter(chapterId: number): Promise<QFChapter> {
  const res = await fetch(`${QF_CONTENT_API}/chapters/${chapterId}?language=en`, {
    next: { revalidate: 86400 * 30 }, // Cache for 30 days
  });

  if (!res.ok) throw new Error(`QF chapters API failed: ${res.status}`);
  const data = await res.json();
  return data.chapter;
}

/** Fetch all chapters */
export async function fetchAllChapters(): Promise<QFChapter[]> {
  const res = await fetch(`${QF_CONTENT_API}/chapters?language=en`, {
    next: { revalidate: 86400 * 30 },
  });

  if (!res.ok) throw new Error(`QF chapters API failed: ${res.status}`);
  const data = await res.json();
  return data.chapters;
}

/** Fetch tafsir for a verse */
export async function fetchTafsir(
  verseKey: string,
  tafsirId: number = 169 // Ibn Kathir (English)
): Promise<{ text: string }> {
  const res = await fetch(`${QF_CONTENT_API}/tafsirs/${tafsirId}/by_ayah/${verseKey}`, {
    next: { revalidate: 86400 },
  });

  if (!res.ok) throw new Error(`QF tafsir API failed: ${res.status}`);
  const data = await res.json();
  return { text: data.tafsir?.text || "" };
}
