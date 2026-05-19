import { NextRequest, NextResponse } from "next/server";
import { fetchVerseByKey, fetchTafsir, fetchChapter } from "@/lib/quran-api";
import { fetchVerseMorphology, toDisplayMorphology } from "@/lib/mcp-client";
import { getDefaultTranslationId, getDefaultTafsirId } from "@/lib/qf-languages";

/**
 * GET /api/lesson/[ayahKey]
 *
 * Fetches a single ayah with:
 *   1. Word-by-word Arabic + translation + transliteration   → QF Content API
 *   2. Morphology per word (root, POS, features, frequency)  → Quran MCP
 *   3. Tafsir for the ayah                                   → QF Content API
 *   4. Ayah Audio                                            → QF Recitations API (7 = Alafasy)
 *   5. Next Ayah calculation                                 → QF Chapters API
 *
 * Query params:
 *   ?lang=en|ur|fr|...          — ISO language code (default: en)
 *   ?translationId=131          — Override default translation edition
 *   ?tafsirId=169               — Override default tafsir edition
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ayahKey: string }> }
) {
  try {
    const { ayahKey } = await params;
    const lang = request.nextUrl.searchParams.get("lang") || "en";

    // Resolve translation and tafsir IDs — use explicit override or dynamic default
    const translationIdParam = request.nextUrl.searchParams.get("translationId");
    const tafsirIdParam = request.nextUrl.searchParams.get("tafsirId");

    const translationId = translationIdParam
      ? Number(translationIdParam)
      : await getDefaultTranslationId(lang);

    const tafsirId = tafsirIdParam
      ? Number(tafsirIdParam)
      : await getDefaultTafsirId(lang);

    const chapterId = parseInt(ayahKey.split(":")[0]);
    const verseNum = parseInt(ayahKey.split(":")[1]);

    // Fetch verse from QF Content API with language-aware word-by-word translations
    const verse = await fetchVerseByKey(ayahKey, { language: lang, translationId });

    // Count actual words (exclude end markers)
    const actualWords = verse.words.filter((w) => w.char_type_name === "word");
    const wordCount = actualWords.length;

    // Fetch morphology, tafsir, ayah audio, and chapter metadata in parallel
    const [morphMap, tafsirData, audioRes, chapter] = await Promise.all([
      fetchVerseMorphology(ayahKey, wordCount).catch(() => new Map()),
      fetchTafsir(ayahKey, tafsirId).catch(() => ({ text: "" })),
      fetch(`https://api.quran.com/api/v4/recitations/7/by_ayah/${ayahKey}`).then(r => r.json()).catch(() => null),
      fetchChapter(chapterId, lang).catch(() => null),
    ]);

    // Build word data with morphology
    const words = actualWords.map((w) => {
      const mcpWord = morphMap.get(w.position);
      const morph = mcpWord ? toDisplayMorphology(mcpWord) : null;

      return {
        position: w.position,
        arabic: w.text_uthmani,
        translation: w.translation?.text || "",
        transliteration: w.transliteration?.text || "",
        audioUrl: w.audio_url ? `https://audio.qurancdn.com/${w.audio_url}` : null,
        morphology: morph
          ? {
              root: morph.root,
              pos: morph.pos,
              features: morph.features,
              lemma: morph.lemma,
              form: morph.form,
              frequency: morph.frequency,
              description: morph.description,
            }
          : null,
      };
    });

    // Get full verse translation
    const translation = verse.translations?.[0]?.text || "";

    const ayahAudioUrl = audioRes?.audio_files?.[0]?.url 
      ? `https://audio.qurancdn.com/${audioRes.audio_files[0].url}` 
      : null;

    let nextAyahKey = null;
    if (chapter) {
      if (verseNum < chapter.verses_count) {
        nextAyahKey = `${chapterId}:${verseNum + 1}`;
      }
      // No auto-advance to next chapter — surah picker handles this
    }

    return NextResponse.json({
      ayahKey: verse.verse_key,
      verseNumber: verse.verse_number,
      juzNumber: verse.juz_number,
      arabic: verse.text_uthmani,
      translation,
      tafsir: tafsirData.text,
      words,
      lang,
      ayahAudioUrl,
      nextAyahKey,
    });
  } catch (err) {
    console.error("Lesson fetch error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch lesson" },
      { status: 500 }
    );
  }
}
