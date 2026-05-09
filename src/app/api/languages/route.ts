import { NextRequest, NextResponse } from "next/server";
import {
  fetchQFLanguages,
  fetchQFTranslations,
  fetchQFTafsirs,
} from "@/lib/qf-languages";

/**
 * GET /api/languages
 *   → { languages: QFLanguage[] }
 *
 * GET /api/languages?translations=ur
 *   → { translations: QFTranslationResource[] }
 *
 * GET /api/languages?tafsirs=en
 *   → { tafsirs: QFTafsirResource[] }
 *
 * Serves QF language and resource data to the Settings screen.
 * Server-side caching (24h) prevents excessive QF API calls.
 */
export async function GET(request: NextRequest) {
  try {
    const translationsLang = request.nextUrl.searchParams.get("translations");
    const tafsirsLang = request.nextUrl.searchParams.get("tafsirs");

    // Fetch translations for a specific language
    if (translationsLang) {
      const translations = await fetchQFTranslations(translationsLang);
      return NextResponse.json({ translations });
    }

    // Fetch tafsirs for a specific language
    if (tafsirsLang) {
      const tafsirs = await fetchQFTafsirs(tafsirsLang);
      return NextResponse.json({ tafsirs });
    }

    // Default: fetch all languages
    const languages = await fetchQFLanguages();
    return NextResponse.json({ languages });
  } catch (err) {
    console.error("Languages API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch languages" },
      { status: 500 }
    );
  }
}
