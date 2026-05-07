/**
 * Deduplication Engine — Root-Aware Vocabulary Classification
 *
 * Per spec Section 8: Deduplication Engine
 *
 * Levels:
 *   L-1: Particle (no root) → skip
 *   L0:  New root, never seen → TEACH (new)
 *   L1:  Exact surface form already learned → reinforce
 *   L2:  Same root + same POS → reinforce
 *   L3:  Same root, different meaning cluster → TEACH (meaning shift)
 *   L4:  Same root + same meaning cluster → reinforce
 */

export type DedupLevel = -1 | 0 | 1 | 2 | 3 | 4;
export type DedupVerdict = "new" | "reinforce" | "particle";

export interface MorphologyData {
  arabic: string;
  root: string;
  lemma: string;
  pos: string;         // e.g. "N", "V", "PRON", "P", etc.
  form: string;
  meaningCluster: string; // e.g. "guidance", "mercy" — from MCP
  frequencyRoot: number;
}

export interface DedupDecision {
  level: DedupLevel;
  verdict: DedupVerdict;
  reason: string;
  xpAward: number;
}

// Particles have no root — skip entirely
const PARTICLE_POS = new Set(["P", "CONJ", "INTG", "CERT", "RET", "CIRC", "SUP", "EXP", "PREV"]);

export interface LedgerEntry {
  root: string;
  surfaceForms: Set<string>;
  posSet: Set<string>;
  meaningClusters: Set<string>;
}

/**
 * Deduplicate a word against the user's existing vocabulary ledger.
 *
 * @param word - Morphology data for the word to classify
 * @param ledger - Map of root → LedgerEntry for all previously learned words
 * @returns DedupDecision with level, verdict, reason, and XP award
 */
export function dedupWord(
  word: MorphologyData,
  ledger: Map<string, LedgerEntry>
): DedupDecision {
  // L-1: Particle check
  if (!word.root || PARTICLE_POS.has(word.pos)) {
    return {
      level: -1,
      verdict: "particle",
      reason: `"${word.arabic}" is a particle (${word.pos}) — no root to teach`,
      xpAward: 0,
    };
  }

  const entry = ledger.get(word.root);

  // L0: Root never seen before → NEW
  if (!entry) {
    return {
      level: 0,
      verdict: "new",
      reason: `Root "${word.root}" seen for the first time → teach as new vocabulary`,
      xpAward: 10,
    };
  }

  // L1: Exact surface form already learned → reinforce
  if (entry.surfaceForms.has(word.arabic)) {
    return {
      level: 1,
      verdict: "reinforce",
      reason: `"${word.arabic}" already learned (exact surface form match)`,
      xpAward: 0,
    };
  }

  // L2: Same root + same POS → reinforce (morphological variant)
  if (entry.posSet.has(word.pos)) {
    return {
      level: 2,
      verdict: "reinforce",
      reason: `Root "${word.root}" already has a ${word.pos} form → reinforce`,
      xpAward: 0,
    };
  }

  // L3 vs L4: Check meaning cluster
  if (word.meaningCluster && entry.meaningClusters.has(word.meaningCluster)) {
    // L4: Same root + same meaning cluster → reinforce
    return {
      level: 4,
      verdict: "reinforce",
      reason: `Root "${word.root}" already covers meaning "${word.meaningCluster}" → reinforce`,
      xpAward: 0,
    };
  }

  // L3: Same root, different/new meaning cluster → meaning shift → TEACH
  return {
    level: 3,
    verdict: "new",
    reason: `Root "${word.root}" has new meaning "${word.meaningCluster}" → teach as meaning shift`,
    xpAward: 15,
  };
}

/**
 * Update the ledger with a newly learned/reinforced word.
 */
export function updateLedger(
  ledger: Map<string, LedgerEntry>,
  word: MorphologyData
): void {
  if (!word.root || PARTICLE_POS.has(word.pos)) return;

  let entry = ledger.get(word.root);
  if (!entry) {
    entry = {
      root: word.root,
      surfaceForms: new Set(),
      posSet: new Set(),
      meaningClusters: new Set(),
    };
    ledger.set(word.root, entry);
  }

  entry.surfaceForms.add(word.arabic);
  entry.posSet.add(word.pos);
  if (word.meaningCluster) {
    entry.meaningClusters.add(word.meaningCluster);
  }
}
