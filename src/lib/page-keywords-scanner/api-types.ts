import type { KeywordCategory } from './crypto-keywords';

export interface PageAnalysisRequest {
  url: string;
  hostname: string;
  snippets: SnippetForAnalysis[];
  keywords: string[];
  categories: KeywordCategory[];
  timestamp: number;
}

// ts-prune-ignore-next
export interface SnippetForAnalysis {
  text: string;
  keywords: string[];
}

export interface PageAnalysisResponse {
  /** Whether tradeable crypto content was detected */
  hasTradingSignal: boolean;
  analysis: PageAnalysis;
  suggestions: TradingSuggestion[];
}

export interface PageAnalysis {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  /** Confidence score (0-1) */
  confidence: number;
  summary: string;
}

export interface TradingSuggestion {
  id: string;
  action: TradingAction;
  asset: TradingAsset;
  platform: TradingPlatform;
  ui: SuggestionUI;
  params: TradingParams;
  reasoning: string;
  expiresAt: number;
}

// ts-prune-ignore-next
export type TradingAction = 'open_long' | 'open_short' | 'close_position' | 'add_to_watchlist' | 'swap';

// ts-prune-ignore-next
export type TradingPlatform = 'hyperliquid' | 'temple_swap';

// ts-prune-ignore-next
export interface TradingAsset {
  /** Token symbol (e.g., "BTC", "ETH") */
  symbol: string;
  /** Full name (e.g., "Bitcoin") */
  name: string;
  chainId?: number;
  /** Contract address if applicable */
  address?: string;
}

interface SuggestionUI {
  /** Main title (e.g., "Open BTC Long") */
  title: string;
  /** Subtitle/context (e.g., "Based on bullish ETF news") */
  subtitle: string;
  ctaText: string;
  /** Optional icon URL */
  icon?: string;
  priority: 'high' | 'medium' | 'low';
}

interface TradingParams {
  /** Market identifier (e.g., "BTC-PERP") */
  market?: string;
  /** Trade side */
  side?: 'buy' | 'sell';
  /** Suggested leverage (user can modify) */
  suggestedLeverage?: number;
  /** Suggested size in USD (user can modify) */
  suggestedSizeUsd?: number;
  /** Swap input token */
  inputToken?: string;
  /** Swap output token */
  outputToken?: string;
}

/**
 * Builds a PageAnalysisRequest from scan results.
 */
export function buildAnalysisRequest(
  url: string,
  snippets: Array<{ text: string; keywords: string[] }>,
  keywords: string[],
  categories: KeywordCategory[]
): PageAnalysisRequest {
  return {
    url,
    hostname: new URL(url).hostname,
    snippets: snippets.map(s => ({ text: s.text, keywords: s.keywords })),
    keywords,
    categories,
    timestamp: Date.now()
  };
}
