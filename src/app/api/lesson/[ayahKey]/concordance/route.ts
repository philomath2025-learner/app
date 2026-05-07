import { NextRequest, NextResponse } from "next/server";
import { fetchWordConcordance } from "@/lib/mcp-client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ayahKey: string }> }
) {
  try {
    const { ayahKey } = await params;
    const wordPosition = parseInt(request.nextUrl.searchParams.get("pos") || "0", 10);
    const textUthmani = request.nextUrl.searchParams.get("text") || "";

    if (!wordPosition) {
      return NextResponse.json({ relatedForms: [] });
    }

    // Fetch concordance for this word
    const concordance = await fetchWordConcordance(ayahKey, wordPosition, 10);
    
    if (!concordance || !concordance.results) {
      return NextResponse.json({ relatedForms: [] });
    }

    // Extract unique related forms from the results
    const forms = new Set<string>();
    for (const res of concordance.results) {
      for (const match of res.matched_words) {
        // Only include if it's not the exact same surface form (ignoring minor diacritic differences if needed, 
        // but simple exact match check is fine)
        if (match.text_uthmani !== textUthmani && match.match_level !== "exact") {
          forms.add(match.text_uthmani);
        }
      }
    }

    // Convert Set to Array and return up to 6 unique related forms
    return NextResponse.json({ relatedForms: Array.from(forms).slice(0, 6) });
  } catch (error) {
    console.error("Concordance error:", error);
    return NextResponse.json({ relatedForms: [] });
  }
}
