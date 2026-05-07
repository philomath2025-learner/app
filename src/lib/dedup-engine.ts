import { VocabularyLedgerEntry } from "./storage/interface";

export type WordStatus = "new" | "known" | "reinforce" | "particle";

export interface DedupedWord {
  position: number;
  arabic: string;
  translation: string;
  transliteration: string;
  audioUrl: string | null;
  morphology: {
    root: string;
    pos: string;
    features: string[];
    lemma: string;
    form: string;
    frequency: number;
    description?: string;
  } | null;
  status: WordStatus;
}

/**
 * 5-Level Deduplication Engine (L0-L4)
 * Evaluates words from an Ayah against the user's known roots ledger.
 */
export function runDedupEngine(
  rawWords: any[],
  knownLedger: Map<string, VocabularyLedgerEntry>
): DedupedWord[] {
  return rawWords.map((word) => {
    // Instead of auto-skipping particles, we use the lemma as the "root" fallback.
    // This correctly groups prefixed words (e.g. "إِيَّاكَ" and "وَإِيَّاكَ" both have lemma "إِيَّا")
    const root = word.morphology?.root || word.morphology?.lemma || word.arabic;
    const pos = word.morphology?.pos || "particle";
    const knownEntry = knownLedger.get(root);

    // L0: Completely new root
    if (!knownEntry) {
      return { ...word, status: "new" };
    }

    // L1 / L2: Exact Match or Same Root + Same POS
    if (knownEntry.lemma === word.morphology?.lemma || knownEntry.pos === pos) {
      return { ...word, status: "known" }; // Skip heavy flashcard
    }

    // L3 / L4: Same Root, but Meaning Shift or Form Shift
    // In MVP, we treat any POS mismatch (e.g. Noun vs Verb) for a known root as "reinforce".
    // A true L3 "meaning shift" might be taught as "new", but "reinforce" requires 
    // them to click the button but we acknowledge they know the root.
    return { ...word, status: "reinforce" };
  });
}
