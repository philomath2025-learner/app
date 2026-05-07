/**
 * Quranic Morphology Data — Al-Fatiha (1:1–1:7)
 *
 * Source: Quranic Arabic Corpus (corpus.quran.com)
 * Each word mapped by location "chapter:verse:word_position"
 *
 * Fields match the prototype's word detail panel:
 *   - root (Arabic trilateral root)
 *   - pos (Part of Speech)
 *   - posLabel (human-readable POS)
 *   - features (array of grammar tags: case, state, gender, number, etc.)
 *   - lemma
 *   - form (verb form if applicable)
 *   - frequency (how many times this root appears in the entire Quran)
 */

export interface WordMorphology {
  location: string;     // "1:1:1"
  root: string;         // "س م و" → "س-م-و"
  rootAr: string;       // Arabic root with dashes
  pos: string;          // "N", "PN", "V", "P", "DET", etc.
  posLabel: string;     // "Noun", "Proper Noun", "Verb", etc.
  features: string[];   // ["Genitive", "Masculine", "Singular"]
  lemma: string;        // Arabic lemma
  form: string;         // Verb form (I–X) or noun pattern
  frequency: number;    // Root frequency in entire Quran
}

// Root frequencies from Quranic Arabic Corpus (approximate, for Al-Fatiha roots)
const ROOT_FREQ: Record<string, number> = {
  "س-م-و": 381,   // ism/name
  "ا-ل-ه": 2851,  // Allah/god
  "ر-ح-م": 339,   // mercy
  "ح-م-د": 63,    // praise
  "ر-ب-ب": 980,   // lord/nourish
  "ع-ل-م": 854,   // world/know
  "م-ل-ك": 206,   // master/king
  "ي-و-م": 405,   // day
  "د-ي-ن": 101,   // religion/judgment
  "ع-ب-د": 275,   // worship/serve
  "ع-و-ن": 11,    // help/aid
  "ه-د-ي": 316,   // guide
  "ص-ر-ط": 45,    // path
  "ق-و-م": 660,   // straight/stand
  "ن-ع-م": 107,   // favor/bestow
  "غ-ض-ب": 24,    // wrath/anger
  "ض-ل-ل": 191,   // go astray
  "غ-ي-ر": 96,    // other/not
};

/** Morphology data for Al-Fatiha words */
const FATIHA_MORPHOLOGY: Record<string, WordMorphology> = {
  // 1:1 - بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
  "1:1:1": {
    location: "1:1:1",
    root: "س-م-و",
    rootAr: "س-م-و",
    pos: "N",
    posLabel: "Noun",
    features: ["Genitive", "Masculine", "Singular"],
    lemma: "ٱسْم",
    form: "Masdar",
    frequency: ROOT_FREQ["س-م-و"],
  },
  "1:1:2": {
    location: "1:1:2",
    root: "ا-ل-ه",
    rootAr: "ا-ل-ه",
    pos: "PN",
    posLabel: "Proper Noun",
    features: ["Genitive"],
    lemma: "ٱللَّه",
    form: "",
    frequency: ROOT_FREQ["ا-ل-ه"],
  },
  "1:1:3": {
    location: "1:1:3",
    root: "ر-ح-م",
    rootAr: "ر-ح-م",
    pos: "ADJ",
    posLabel: "Adjective",
    features: ["Genitive", "Masculine", "Singular", "Definite"],
    lemma: "رَحْمَـٰن",
    form: "fa'lān (intensive)",
    frequency: ROOT_FREQ["ر-ح-م"],
  },
  "1:1:4": {
    location: "1:1:4",
    root: "ر-ح-م",
    rootAr: "ر-ح-م",
    pos: "ADJ",
    posLabel: "Adjective",
    features: ["Genitive", "Masculine", "Singular", "Definite"],
    lemma: "رَحِيم",
    form: "fa'īl (intensive)",
    frequency: ROOT_FREQ["ر-ح-م"],
  },

  // 1:2 - ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ
  "1:2:1": {
    location: "1:2:1",
    root: "ح-م-د",
    rootAr: "ح-م-د",
    pos: "N",
    posLabel: "Noun",
    features: ["Nominative", "Masculine", "Singular", "Definite"],
    lemma: "حَمْد",
    form: "Masdar",
    frequency: ROOT_FREQ["ح-م-د"],
  },
  "1:2:2": {
    location: "1:2:2",
    root: "ا-ل-ه",
    rootAr: "ا-ل-ه",
    pos: "PN",
    posLabel: "Proper Noun",
    features: ["Genitive"],
    lemma: "ٱللَّه",
    form: "",
    frequency: ROOT_FREQ["ا-ل-ه"],
  },
  "1:2:3": {
    location: "1:2:3",
    root: "ر-ب-ب",
    rootAr: "ر-ب-ب",
    pos: "N",
    posLabel: "Noun",
    features: ["Genitive", "Masculine", "Singular"],
    lemma: "رَبّ",
    form: "",
    frequency: ROOT_FREQ["ر-ب-ب"],
  },
  "1:2:4": {
    location: "1:2:4",
    root: "ع-ل-م",
    rootAr: "ع-ل-م",
    pos: "N",
    posLabel: "Noun",
    features: ["Genitive", "Masculine", "Plural", "Definite"],
    lemma: "عَـٰلَم",
    form: "",
    frequency: ROOT_FREQ["ع-ل-م"],
  },

  // 1:3 - ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ (repeated from 1:1)
  "1:3:1": {
    location: "1:3:1",
    root: "ر-ح-م",
    rootAr: "ر-ح-م",
    pos: "ADJ",
    posLabel: "Adjective",
    features: ["Genitive", "Masculine", "Singular", "Definite"],
    lemma: "رَحْمَـٰن",
    form: "fa'lān (intensive)",
    frequency: ROOT_FREQ["ر-ح-م"],
  },
  "1:3:2": {
    location: "1:3:2",
    root: "ر-ح-م",
    rootAr: "ر-ح-م",
    pos: "ADJ",
    posLabel: "Adjective",
    features: ["Genitive", "Masculine", "Singular", "Definite"],
    lemma: "رَحِيم",
    form: "fa'īl (intensive)",
    frequency: ROOT_FREQ["ر-ح-م"],
  },

  // 1:4 - مَـٰلِكِ يَوْمِ ٱلدِّينِ
  "1:4:1": {
    location: "1:4:1",
    root: "م-ل-ك",
    rootAr: "م-ل-ك",
    pos: "N",
    posLabel: "Noun",
    features: ["Genitive", "Masculine", "Singular"],
    lemma: "مَـٰلِك",
    form: "Active Participle",
    frequency: ROOT_FREQ["م-ل-ك"],
  },
  "1:4:2": {
    location: "1:4:2",
    root: "ي-و-م",
    rootAr: "ي-و-م",
    pos: "N",
    posLabel: "Noun",
    features: ["Genitive", "Masculine", "Singular"],
    lemma: "يَوْم",
    form: "",
    frequency: ROOT_FREQ["ي-و-م"],
  },
  "1:4:3": {
    location: "1:4:3",
    root: "د-ي-ن",
    rootAr: "د-ي-ن",
    pos: "N",
    posLabel: "Noun",
    features: ["Genitive", "Masculine", "Singular", "Definite"],
    lemma: "دِين",
    form: "",
    frequency: ROOT_FREQ["د-ي-ن"],
  },

  // 1:5 - إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ
  "1:5:1": {
    location: "1:5:1",
    root: "",
    rootAr: "",
    pos: "PRON",
    posLabel: "Pronoun",
    features: ["2nd Person", "Masculine", "Singular", "Accusative"],
    lemma: "إِيَّا",
    form: "",
    frequency: 0,
  },
  "1:5:2": {
    location: "1:5:2",
    root: "ع-ب-د",
    rootAr: "ع-ب-د",
    pos: "V",
    posLabel: "Verb",
    features: ["Imperfect", "1st Person", "Plural", "Indicative"],
    lemma: "عَبَدَ",
    form: "Form I",
    frequency: ROOT_FREQ["ع-ب-د"],
  },
  "1:5:3": {
    location: "1:5:3",
    root: "",
    rootAr: "",
    pos: "CONJ+PRON",
    posLabel: "Conjunction + Pronoun",
    features: ["Conjunction وَ", "2nd Person", "Masculine", "Singular"],
    lemma: "وَ + إِيَّا",
    form: "",
    frequency: 0,
  },
  "1:5:4": {
    location: "1:5:4",
    root: "ع-و-ن",
    rootAr: "ع-و-ن",
    pos: "V",
    posLabel: "Verb",
    features: ["Imperfect", "1st Person", "Plural", "Form X", "Indicative"],
    lemma: "ٱسْتَعَانَ",
    form: "Form X",
    frequency: ROOT_FREQ["ع-و-ن"],
  },

  // 1:6 - ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ
  "1:6:1": {
    location: "1:6:1",
    root: "ه-د-ي",
    rootAr: "ه-د-ي",
    pos: "V",
    posLabel: "Verb",
    features: ["Imperative", "2nd Person", "Masculine", "Singular", "Form I"],
    lemma: "هَدَىٰ",
    form: "Form I",
    frequency: ROOT_FREQ["ه-د-ي"],
  },
  "1:6:2": {
    location: "1:6:2",
    root: "ص-ر-ط",
    rootAr: "ص-ر-ط",
    pos: "N",
    posLabel: "Noun",
    features: ["Accusative", "Masculine", "Singular", "Definite"],
    lemma: "صِرَٰط",
    form: "",
    frequency: ROOT_FREQ["ص-ر-ط"],
  },
  "1:6:3": {
    location: "1:6:3",
    root: "ق-و-م",
    rootAr: "ق-و-م",
    pos: "ADJ",
    posLabel: "Adjective",
    features: ["Accusative", "Masculine", "Singular", "Definite", "Active Participle"],
    lemma: "مُسْتَقِيم",
    form: "Form X Participle",
    frequency: ROOT_FREQ["ق-و-م"],
  },

  // 1:7 - صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ
  "1:7:1": {
    location: "1:7:1",
    root: "ص-ر-ط",
    rootAr: "ص-ر-ط",
    pos: "N",
    posLabel: "Noun",
    features: ["Accusative", "Masculine", "Singular"],
    lemma: "صِرَٰط",
    form: "",
    frequency: ROOT_FREQ["ص-ر-ط"],
  },
  "1:7:2": {
    location: "1:7:2",
    root: "",
    rootAr: "",
    pos: "REL",
    posLabel: "Relative Pronoun",
    features: ["Masculine", "Plural"],
    lemma: "ٱلَّذِى",
    form: "",
    frequency: 0,
  },
  "1:7:3": {
    location: "1:7:3",
    root: "ن-ع-م",
    rootAr: "ن-ع-م",
    pos: "V",
    posLabel: "Verb",
    features: ["Perfect", "2nd Person", "Masculine", "Singular", "Form IV"],
    lemma: "أَنْعَمَ",
    form: "Form IV",
    frequency: ROOT_FREQ["ن-ع-م"],
  },
  "1:7:4": {
    location: "1:7:4",
    root: "",
    rootAr: "",
    pos: "P+PRON",
    posLabel: "Preposition + Pronoun",
    features: ["3rd Person", "Masculine", "Plural"],
    lemma: "عَلَىٰ + هُمْ",
    form: "",
    frequency: 0,
  },
  "1:7:5": {
    location: "1:7:5",
    root: "غ-ي-ر",
    rootAr: "غ-ي-ر",
    pos: "N",
    posLabel: "Noun",
    features: ["Genitive", "Masculine", "Singular"],
    lemma: "غَيْر",
    form: "",
    frequency: ROOT_FREQ["غ-ي-ر"],
  },
  "1:7:6": {
    location: "1:7:6",
    root: "غ-ض-ب",
    rootAr: "غ-ض-ب",
    pos: "ADJ",
    posLabel: "Passive Participle",
    features: ["Genitive", "Masculine", "Singular", "Definite", "Passive"],
    lemma: "مَغْضُوب",
    form: "Form I Passive Participle",
    frequency: ROOT_FREQ["غ-ض-ب"],
  },
  "1:7:7": {
    location: "1:7:7",
    root: "",
    rootAr: "",
    pos: "P+PRON",
    posLabel: "Preposition + Pronoun",
    features: ["3rd Person", "Masculine", "Plural"],
    lemma: "عَلَىٰ + هُمْ",
    form: "",
    frequency: 0,
  },
  "1:7:8": {
    location: "1:7:8",
    root: "",
    rootAr: "",
    pos: "CONJ+NEG",
    posLabel: "Conjunction + Negative",
    features: ["Conjunction وَ", "Negative لَا"],
    lemma: "وَلَا",
    form: "",
    frequency: 0,
  },
  "1:7:9": {
    location: "1:7:9",
    root: "ض-ل-ل",
    rootAr: "ض-ل-ل",
    pos: "N",
    posLabel: "Active Participle",
    features: ["Genitive", "Masculine", "Plural", "Definite"],
    lemma: "ضَآلّ",
    form: "Form I Active Participle",
    frequency: ROOT_FREQ["ض-ل-ل"],
  },
};

/** Look up morphology for a word by its location */
export function getMorphology(verseKey: string, wordPosition: number): WordMorphology | null {
  const key = `${verseKey}:${wordPosition}`;
  return FATIHA_MORPHOLOGY[key] || null;
}

/** Get root frequency count */
export function getRootFrequency(root: string): number {
  return ROOT_FREQ[root] || 0;
}

/** Export for testing */
export { FATIHA_MORPHOLOGY, ROOT_FREQ };
