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
  verdict: "NEW" | "reinforce" | "skip";
  rule: string;
  reason: string;
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

    // Particle logic - only skip if it has NEITHER a root NOR a lemma
    if (!word.morphology?.root && !word.morphology?.lemma) {
      return { 
        ...word, 
        status: "particle", 
        verdict: "skip", 
        rule: "L1", 
        reason: `${pos} — no root or lemma` 
      };
    }

    // L0: Completely new root
    if (!knownEntry) {
      const freqText = word.morphology?.frequency ? `, ${word.morphology.frequency} occurrences` : "";
      return { 
        ...word, 
        status: "new", 
        verdict: "NEW", 
        rule: "NEW", 
        reason: `First encounter ${root} root — ${pos} form${freqText}` 
      };
    }

    // L1 / L2: Exact Match or Same Root + Same POS
    if (knownEntry.lemma === word.morphology?.lemma || knownEntry.pos === pos) {
      const rule = knownEntry.lemma === word.morphology?.lemma ? "L1" : "L2";
      const firstAt = knownEntry.first_ayah_key || knownEntry.first_seen_ayah;
      return { 
        ...word, 
        status: "known", 
        verdict: "skip", 
        rule: rule, 
        reason: `Same root ${root}, same ${rule === "L1" ? "lemma" : "pos"} — known${firstAt ? `. First at ${firstAt}` : ''}` 
      }; // Skip heavy flashcard
    }

    // L3 / L4: Same Root, but Meaning Shift or Form Shift
    const firstAt = knownEntry.first_ayah_key || knownEntry.first_seen_ayah;
    return { 
      ...word, 
      status: "reinforce", 
      verdict: "reinforce", 
      rule: "L2", 
      reason: `Same root ${root}, different form/pos — reinforce only${firstAt ? `. First at ${firstAt}` : ''}` 
    };
  });
}
