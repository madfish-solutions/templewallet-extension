/**
 * Keyword scanner that matches text against the crypto keywords dictionary.
 */

import { CRYPTO_KEYWORDS, WHOLE_WORD_KEYWORDS, KeywordMatch, KeywordCategory } from './crypto-keywords';

export interface KeywordSnippet {
  text: string;
  keywords: string[];
  category: KeywordCategory;
}

export interface ScanResult {
  keywords: KeywordMatch[];
  snippets: KeywordSnippet[];
  uniqueCount: number;
  totalMatches: number;
  categories: KeywordCategory[];
  scanTimeMs: number;
}

/** Maximum number of snippets to extract */
const MAX_SNIPPETS = 15;

/** Maximum length of a single snippet */
const MAX_SNIPPET_LENGTH = 300;

/** Minimum length for a snippet to be useful */
const MIN_SNIPPET_LENGTH = 50;

/**
 * Patterns that indicate low-quality snippets (polls, surveys, UI elements).
 * These should be filtered out as they don't provide real market insight.
 */
const LOW_QUALITY_PATTERNS = [
  // Polls and surveys
  /how do you feel/i,
  /what do you think/i,
  /vote now/i,
  /cast your vote/i,
  /community (is|feels|thinks|says|votes)/i,
  /\d+% (bullish|bearish|neutral)/i,

  // Questions without answers
  /^(what|when|where|why|how|is|are|will|should|can|do|does)\s/i,

  // UI elements and navigation
  /^(buy|sell|trade|swap|click|tap|view|see|show|hide|more|less)\s/i,
  /^(home|about|contact|login|signup|register|menu|search)\b/i,
  /(read more|learn more|click here|see all|view all)/i,
  /cookie|privacy policy|terms of (use|service)/i,

  // Generic descriptions without substance
  /^(the|a|an)\s+\w+\s+(is|are)\s+(a|an|the)\s/i,
  /price (is|was|has been)\s+\$?[\d,.]+/i,

  // Social proof without analysis
  /\d+\s*(followers|likes|views|comments|shares)/i,
  /join\s+\d+/i,

  // Time-based UI elements
  /^\d+\s*(seconds?|minutes?|hours?|days?|weeks?|months?)\s+ago/i,
  /^(today|yesterday|last\s+\w+|this\s+\w+)$/i
];

/**
 * Patterns that indicate high-quality snippets (analysis, predictions, news).
 * Snippets matching these get priority.
 */
const HIGH_QUALITY_INDICATORS = [
  // Analysis and predictions
  /price target/i,
  /price prediction/i,
  /analyst/i,
  /forecast/i,
  /technical analysis/i,
  /support (level|at|around)/i,
  /resistance (level|at|around)/i,

  // Market movements with a direction
  /(surge|soar|jump|spike|rally|pump)s?\s/i,
  /(crash|plunge|dump|drop|fall|sink)s?\s/i,
  /(up|down|rise|fell|gained|lost)\s+\d+%/i,

  // News indicators
  /announced/i,
  /launched/i,
  /partnership/i,
  /integration/i,
  /upgrade/i,
  /breaking/i,

  // Financial context
  /market cap/i,
  /trading volume/i,
  /all[- ]time (high|low)/i,
  /whale/i,
  /institutional/i
];

/**
 * Checks if a snippet is low quality and should be filtered out.
 */
function isLowQualitySnippet(text: string): boolean {
  const normalized = text.trim();

  if (normalized.length < MIN_SNIPPET_LENGTH) return true;

  const letterRatio = (normalized.match(/[a-zA-Z]/g)?.length ?? 0) / normalized.length;
  if (letterRatio < 0.5) return true;

  for (const pattern of LOW_QUALITY_PATTERNS) {
    if (pattern.test(normalized)) return true;
  }

  return false;
}

/**
 * Calculates a quality score for a snippet (higher = better).
 */
function getSnippetQualityScore(text: string, keywordCount: number): number {
  let score = keywordCount * 2;

  for (const pattern of HIGH_QUALITY_INDICATORS) {
    if (pattern.test(text)) {
      score += 3;
    }
  }

  if (text.length > 100) score += 1;
  if (text.length > 200) score += 1;

  if (/\$[\d,.]+|\d+%/.test(text) && /(up|down|rise|fell|gained|lost|to|from)/i.test(text)) {
    score += 2;
  }

  return score;
}

/**
 * Normalizes text for keyword matching.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Splits text into sentences using common delimiters.
 */
function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|[\n\r]+/)
    .map(s => s.trim())
    .filter(s => s.length >= MIN_SNIPPET_LENGTH);
}

interface ScoredSnippet extends KeywordSnippet {
  score: number;
}

/**
 * Extracts high-quality snippets (sentences) that contain crypto keywords.
 * Filters out low-quality content like polls, UI elements, and context-less data.
 */
function extractSnippets(originalText: string, matchedKeywords: Map<string, KeywordMatch>): KeywordSnippet[] {
  if (matchedKeywords.size === 0) return [];

  const sentences = splitIntoSentences(originalText);
  const scoredSnippets: ScoredSnippet[] = [];
  const seenSnippets = new Set<string>();

  const keywordsList = Array.from(matchedKeywords.keys());

  for (const sentence of sentences) {
    if (isLowQualitySnippet(sentence)) {
      continue;
    }

    const normalizedSentence = normalizeText(sentence);

    const foundKeywords: string[] = [];
    let primaryCategory: KeywordCategory = 'cryptocurrency';

    for (const keyword of keywordsList) {
      const isWholeWord = WHOLE_WORD_KEYWORDS.has(keyword);
      const pattern = createKeywordPattern(keyword, isWholeWord);

      if (pattern.test(normalizedSentence)) {
        foundKeywords.push(keyword);
        if (foundKeywords.length === 1) {
          primaryCategory = matchedKeywords.get(keyword)!.category;
        }
      }
    }

    if (foundKeywords.length > 0) {
      let snippetText = sentence;
      if (snippetText.length > MAX_SNIPPET_LENGTH) {
        snippetText = snippetText.slice(0, MAX_SNIPPET_LENGTH).trim() + '...';
      }

      // Avoid duplicate snippets
      const snippetKey = normalizeText(snippetText).slice(0, 100);
      if (!seenSnippets.has(snippetKey)) {
        seenSnippets.add(snippetKey);

        const score = getSnippetQualityScore(snippetText, foundKeywords.length);
        scoredSnippets.push({
          text: snippetText,
          keywords: foundKeywords,
          category: primaryCategory,
          score
        });
      }
    }
  }

  // Sort by quality score (highest first), then take top MAX_SNIPPETS
  scoredSnippets.sort((a, b) => b.score - a.score);

  // Return without the score field
  return scoredSnippets.slice(0, MAX_SNIPPETS).map(({ text, keywords, category }) => ({
    text,
    keywords,
    category
  }));
}

/**
 * Creates a word boundary regex pattern for a keyword.
 * Handles multi-word phrases and single words.
 */
function createKeywordPattern(keyword: string, wholeWord: boolean): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  if (wholeWord) {
    return new RegExp(`(?:^|\\s|[^\\w])${escaped}(?:$|\\s|[^\\w])`, 'gi');
  }

  return new RegExp(`(?:^|\\s|[^\\w])${escaped}`, 'gi');
}

interface ScanOptions {
  minCount?: number;
  maxKeywords?: number;
  extractSnippets?: boolean;
}

/**
 * Scans text for crypto-related keywords.
 */
export function scanForKeywords(text: string, options: ScanOptions = {}): ScanResult {
  const { minCount = 1, maxKeywords = 50, extractSnippets: shouldExtractSnippets = true } = options;

  const startTime = performance.now();

  if (!text || text.length < 3) {
    return {
      keywords: [],
      snippets: [],
      uniqueCount: 0,
      totalMatches: 0,
      categories: [],
      scanTimeMs: performance.now() - startTime
    };
  }

  const normalizedText = normalizeText(text);
  const matches = new Map<string, KeywordMatch>();

  for (const [keyword, definition] of Object.entries(CRYPTO_KEYWORDS)) {
    const isWholeWord = WHOLE_WORD_KEYWORDS.has(keyword);
    const pattern = createKeywordPattern(keyword, isWholeWord);

    const matchArray = normalizedText.match(pattern);
    const count = matchArray?.length ?? 0;

    if (count >= minCount) {
      const existing = matches.get(keyword);
      if (existing) {
        existing.count += count;
      } else {
        matches.set(keyword, {
          keyword,
          category: definition.category,
          count
        });
      }
    }
  }

  const keywords = Array.from(matches.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, maxKeywords);

  const categories = [...new Set(keywords.map(k => k.category))];

  const totalMatches = keywords.reduce((sum, k) => sum + k.count, 0);

  const snippets = shouldExtractSnippets ? extractSnippets(text, matches) : [];

  return {
    keywords,
    snippets,
    uniqueCount: keywords.length,
    totalMatches,
    categories,
    scanTimeMs: performance.now() - startTime
  };
}

/**
 * Quick check if the text contains any crypto-related keywords.
 */
export function containsCryptoKeywords(text: string): boolean {
  if (!text || text.length < 3) return false;

  const normalizedText = normalizeText(text);

  const commonKeywords = [
    'crypto',
    'bitcoin',
    'ethereum',
    'blockchain',
    'nft',
    'defi',
    'wallet',
    'token',
    'btc',
    'eth'
  ];

  for (const keyword of commonKeywords) {
    if (normalizedText.includes(keyword)) {
      return true;
    }
  }

  return false;
}

/**
 * Merges two scan results (useful for incremental updates).
 */
export function mergeScanResults(existing: ScanResult, newResult: ScanResult): ScanResult {
  const mergedMap = new Map<string, KeywordMatch>();

  for (const kw of existing.keywords) {
    mergedMap.set(kw.keyword, { ...kw });
  }

  for (const kw of newResult.keywords) {
    const existingKw = mergedMap.get(kw.keyword);
    if (existingKw) {
      existingKw.count += kw.count;
    } else {
      mergedMap.set(kw.keyword, { ...kw });
    }
  }

  const keywords = Array.from(mergedMap.values()).sort((a, b) => b.count - a.count);

  const seenSnippetKeys = new Set(existing.snippets.map(s => normalizeText(s.text).slice(0, 100)));
  const mergedSnippets = [...existing.snippets];

  for (const snippet of newResult.snippets) {
    if (mergedSnippets.length >= MAX_SNIPPETS) break;

    const snippetKey = normalizeText(snippet.text).slice(0, 100);
    if (!seenSnippetKeys.has(snippetKey)) {
      seenSnippetKeys.add(snippetKey);
      mergedSnippets.push(snippet);
    }
  }

  return {
    keywords,
    snippets: mergedSnippets,
    uniqueCount: keywords.length,
    totalMatches: keywords.reduce((sum, k) => sum + k.count, 0),
    categories: [...new Set(keywords.map(k => k.category))],
    scanTimeMs: existing.scanTimeMs + newResult.scanTimeMs
  };
}
