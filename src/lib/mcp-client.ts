/**
 * Quran MCP Client — Direct JSON-RPC over HTTP
 *
 * Calls https://mcp.quran.ai directly (no Anthropic key needed).
 * Handles session management, tool calls, and response parsing.
 */

const MCP_URL = "https://mcp.quran.ai";

// ── Types ──

export interface MCPMorphemeSegment {
  position: number;
  text: string;
  part_of_speech_key: string;
  part_of_speech_name: string;
  grammar_description: string | null;
  pos_tags: string;
  root: string | null;
  lemma: string | null;
  verb_form: string | null;
}

export interface MCPWordMorphology {
  word_id: number;
  position: number;
  text_uthmani: string;
  text_simple: string;
  transliteration: string;
  translation: string;
  root: string | null;
  root_frequency: { word_count: number; verse_count: number } | null;
  lemma: string | null;
  lemma_frequency: { word_count: number; verse_count: number } | null;
  stem: string | null;
  stem_frequency: { word_count: number; verse_count: number } | null;
  grammatical_features: {
    part_of_speech: string | null;
    person: string | null;
    gender: string | null;
    number: string | null;
    aspect: string | null;
    mood: string | null;
    voice: string | null;
    verb_form: string | null;
    definiteness: string | null;
    case: string | null;
    raw_unrecognized_tags: string[];
  };
  morpheme_segments: MCPMorphemeSegment[];
  description: string;
}

export interface MCPConcordanceResult {
  total_verses: number;
  total_words: number;
  results: {
    ayah_key: string;
    verse_text: string;
    score: number;
    matched_words: {
      position: number;
      text_uthmani: string;
      transliteration: string;
      match_level: string;
    }[];
  }[];
}

// ── Session Manager ──

let _sessionId: string | null = null;
let _sessionExpiry: number = 0;

async function getSession(): Promise<string> {
  // Reuse session for 4 minutes (MCP sessions typically last 5 min)
  if (_sessionId && Date.now() < _sessionExpiry) {
    return _sessionId;
  }

  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: { name: "quran-lingo", version: "1.0" },
      },
    }),
  });

  const sessionId = res.headers.get("mcp-session-id");
  if (!sessionId) throw new Error("MCP: No session ID returned");

  // Consume response body
  await res.text();

  _sessionId = sessionId;
  _sessionExpiry = Date.now() + 4 * 60 * 1000;
  return sessionId;
}

// ── Tool Caller ──

async function callTool<T>(
  toolName: string,
  args: Record<string, unknown>
): Promise<T> {
  const sessionId = await getSession();

  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "mcp-session-id": sessionId,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: { name: toolName, arguments: args },
    }),
  });

  const text = await res.text();

  // Parse SSE format: "event: message\r\ndata: {...}\r\n"
  for (const line of text.split("\n")) {
    if (line.startsWith("data: ")) {
      const data = JSON.parse(line.slice(6));
      if (data.error) {
        // Session expired — reset and retry once
        if (data.error.message?.includes("session")) {
          _sessionId = null;
          return callTool<T>(toolName, args);
        }
        throw new Error(`MCP error: ${data.error.message}`);
      }
      return data.result?.structuredContent as T;
    }
  }

  throw new Error("MCP: No data in response");
}

// ── In-Memory Cache ──

const morphologyCache = new Map<string, MCPWordMorphology>();
const concordanceCache = new Map<string, MCPConcordanceResult>();

function morphCacheKey(ayahKey: string, pos: number) {
  return `${ayahKey}:${pos}`;
}

// ── Public API ──

/**
 * Fetch morphology for a single word.
 * Returns root, lemma, POS, grammatical features, morpheme segments, frequency.
 */
export async function fetchWordMorphology(
  ayahKey: string,
  wordPosition: number
): Promise<MCPWordMorphology | null> {
  const key = morphCacheKey(ayahKey, wordPosition);

  // Check cache
  const cached = morphologyCache.get(key);
  if (cached) return cached;

  try {
    const result = await callTool<{ words: MCPWordMorphology[] }>(
      "fetch_word_morphology",
      { ayah_key: ayahKey, word_position: wordPosition }
    );

    const word = result?.words?.[0] || null;
    if (word) {
      morphologyCache.set(key, word);
    }
    return word;
  } catch (err) {
    console.error(`MCP morphology error for ${key}:`, err);
    return null;
  }
}

/**
 * Fetch morphology for ALL words in a verse (batch).
 * More efficient than calling one-by-one.
 */
export async function fetchVerseMorphology(
  ayahKey: string,
  wordCount: number
): Promise<Map<number, MCPWordMorphology>> {
  const result = new Map<number, MCPWordMorphology>();

  // Check if all words are cached
  let allCached = true;
  for (let i = 1; i <= wordCount; i++) {
    const cached = morphologyCache.get(morphCacheKey(ayahKey, i));
    if (cached) {
      result.set(i, cached);
    } else {
      allCached = false;
    }
  }
  if (allCached) return result;

  // Fetch all words at once (MCP supports ayah_key without word_position → returns all words)
  try {
    const data = await callTool<{ words: MCPWordMorphology[] }>(
      "fetch_word_morphology",
      { ayah_key: ayahKey }
    );

    for (const word of data?.words || []) {
      morphologyCache.set(morphCacheKey(ayahKey, word.position), word);
      result.set(word.position, word);
    }
  } catch (err) {
    console.error(`MCP verse morphology error for ${ayahKey}:`, err);
  }

  return result;
}

/**
 * Fetch concordance for a word (other verses sharing the same root/lemma/stem).
 */
export async function fetchWordConcordance(
  ayahKey: string,
  wordPosition: number,
  pageSize: number = 5
): Promise<MCPConcordanceResult | null> {
  const key = morphCacheKey(ayahKey, wordPosition);

  const cached = concordanceCache.get(key);
  if (cached) return cached;

  try {
    const result = await callTool<MCPConcordanceResult>(
      "fetch_word_concordance",
      { ayah_key: ayahKey, word_position: wordPosition, page_size: pageSize }
    );

    if (result) {
      concordanceCache.set(key, result);
    }
    return result;
  } catch (err) {
    console.error(`MCP concordance error for ${key}:`, err);
    return null;
  }
}

// ── Helper: Build display-friendly morphology from MCP data ──

export interface DisplayMorphology {
  root: string;        // e.g. "ك-ت-ب"
  pos: string;         // e.g. "Noun"
  features: string[];  // e.g. ["Nominative", "Masculine", "Singular"]
  lemma: string;
  form: string;        // verb form or description
  frequency: number;   // root word_count across Quran
  description: string; // human-readable description from corpus
}

export function toDisplayMorphology(w: MCPWordMorphology): DisplayMorphology {
  // Find the main content segment (not prefix/suffix)
  const mainSegment = w.morpheme_segments.find(
    (s) => s.root || s.part_of_speech_key === "N" || s.part_of_speech_key === "V"
  ) || w.morpheme_segments[w.morpheme_segments.length - 1];

  // Build root with dashes: "كتب" → "ك-ت-ب"
  const rootRaw = w.root || mainSegment?.root || "";
  const rootDisplay = rootRaw
    ? rootRaw.split("").join("-")
    : "";

  // Determine POS from the main morpheme segment
  const posName = mainSegment?.part_of_speech_name || w.grammatical_features.part_of_speech || "unknown";
  const pos = posName.charAt(0).toUpperCase() + posName.slice(1);

  // Build grammatical feature tags
  const features: string[] = [];
  const gf = w.grammatical_features;

  // From grammar_description: "Genitive masculine noun" → extract tags
  if (mainSegment?.grammar_description) {
    const desc = mainSegment.grammar_description.toLowerCase();
    // Case
    if (desc.includes("nominative")) features.push("Nominative");
    else if (desc.includes("accusative")) features.push("Accusative");
    else if (desc.includes("genitive")) features.push("Genitive");
    // State
    if (desc.includes("definite") || w.morpheme_segments.some(s => s.part_of_speech_name === "determiner")) {
      features.push("Definite");
    }
    // Gender
    if (desc.includes("masculine")) features.push("Masculine");
    else if (desc.includes("feminine")) features.push("Feminine");
    // Number
    if (desc.includes("plural")) features.push("Plural");
    else if (desc.includes("dual")) features.push("Dual");
    else if (desc.includes("singular") || desc.includes("noun") || desc.includes("adjective")) features.push("Singular");
    // Verb features
    if (desc.includes("perfect")) features.push("Perfect");
    else if (desc.includes("imperfect")) features.push("Imperfect");
    else if (desc.includes("imperative")) features.push("Imperative");
    // Voice
    if (desc.includes("passive")) features.push("Passive");
    // Person
    if (gf.person) features.push(`${gf.person} Person`);
  }

  // Deduplicate
  const uniqueFeatures = [...new Set(features)];

  // Verb form
  const form = mainSegment?.verb_form
    ? `Form ${mainSegment.verb_form}`
    : "";

  return {
    root: rootDisplay,
    pos,
    features: uniqueFeatures,
    lemma: w.lemma || mainSegment?.lemma || "",
    form,
    frequency: w.root_frequency?.word_count || 0,
    description: w.description,
  };
}
