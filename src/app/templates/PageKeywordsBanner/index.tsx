import React, { memo, useMemo, useState } from 'react';

import clsx from 'clsx';

import { usePageKeywords } from 'app/hooks/use-page-keywords';
import type { KeywordCategory, KeywordSnippet, TradingSuggestion } from 'lib/page-keywords-scanner';

/** Maximum keywords to show initially */
const MAX_VISIBLE_KEYWORDS = 10;

/** Maximum snippets to show */
const MAX_VISIBLE_SNIPPETS = 3;

/**
 * Banner displaying detected crypto keywords and trading suggestions.
 * Shows in the Home page when keywords are found.
 */
export const PageKeywordsBanner = memo(() => {
  const { data, currentSuggestion, isEnabled, isLoading, isDataStale, setEnabled } = usePageKeywords();
  const [showSnippets, setShowSnippets] = useState(false);

  const displayKeywords = useMemo(() => {
    if (!data?.result.keywords.length) return [];

    return data.result.keywords.slice(0, MAX_VISIBLE_KEYWORDS).map(kw => ({
      ...kw,
      displayName: formatKeyword(kw.keyword)
    }));
  }, [data]);

  const displaySnippets = useMemo(() => {
    if (!data?.result.snippets?.length) return [];

    return data.result.snippets.slice(0, MAX_VISIBLE_SNIPPETS);
  }, [data]);

  if (isLoading) return null;

  if (!isEnabled) {
    return (
      <div className="mx-4 mt-4 p-3 bg-gray-100 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Crypto Content Scanner</p>
            <p className="text-xs text-gray-500">Detect crypto content & get trading suggestions</p>
          </div>
          <button
            onClick={() => setEnabled(true)}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Enable
          </button>
        </div>
      </div>
    );
  }

  // Data is from a different page than the active tab
  if (isDataStale) {
    return (
      <div className="mx-4 mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-base">⏳</span>
          <div>
            <p className="text-sm text-gray-600">Page analysis on cooldown</p>
            <p className="text-xs text-gray-400 mt-0.5">Stay on this page, results will appear shortly.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!displayKeywords.length) return null;

  return (
    <div className="mx-4 mt-4 space-y-3">
      {/* Trading Suggestion for current page (if available and not expired) */}
      {currentSuggestion && (
        <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📈</span>
            <div>
              <p className="text-sm font-medium text-gray-800">Trading Signal Detected</p>
              <p className="text-xs text-gray-500">
                {currentSuggestion.analysis.sentiment === 'bullish'
                  ? '🟢 Bullish'
                  : currentSuggestion.analysis.sentiment === 'bearish'
                  ? '🔴 Bearish'
                  : '⚪ Neutral'}{' '}
                • {Math.round(currentSuggestion.analysis.confidence * 100)}% confidence
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-600 mb-3">{currentSuggestion.analysis.summary}</p>

          <div className="space-y-2">
            {currentSuggestion.suggestions.slice(0, 2).map(suggestion => (
              <TradingSuggestionCard key={suggestion.id} suggestion={suggestion} />
            ))}
          </div>
        </div>
      )}

      {/* Keywords Card */}
      <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-sm font-medium text-gray-700">Found keywords:</p>
            {data && (
              <p className="text-xs text-gray-500 truncate max-w-[200px]" title={data.hostname}>
                {data.hostname}
              </p>
            )}
          </div>
          <button
            onClick={() => setEnabled(false)}
            className="text-gray-400 hover:text-gray-600 text-xs"
            title="Disable scanner"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {displayKeywords.map(kw => (
            <KeywordTag key={kw.keyword} keyword={kw.displayName} category={kw.category} count={kw.count} />
          ))}
        </div>

        {data && data.result.uniqueCount > MAX_VISIBLE_KEYWORDS && (
          <p className="text-xs text-gray-400 mt-2">+{data.result.uniqueCount - MAX_VISIBLE_KEYWORDS} more...</p>
        )}

        {/* Snippets toggle */}
        {displaySnippets.length > 0 && (
          <div className="mt-3 pt-2 border-t border-blue-100">
            <button
              onClick={() => setShowSnippets(!showSnippets)}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>{showSnippets ? '▼' : '▶'}</span>
              <span>
                {showSnippets ? 'Hide' : 'Show'} context ({displaySnippets.length} snippets)
              </span>
            </button>

            {showSnippets && (
              <div className="mt-2 space-y-2">
                {displaySnippets.map((snippet, idx) => (
                  <SnippetCard key={idx} snippet={snippet} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

interface TradingSuggestionCardProps {
  suggestion: TradingSuggestion;
}

const TradingSuggestionCard = memo<TradingSuggestionCardProps>(({ suggestion }) => {
  const priorityColors = {
    high: 'border-green-300 bg-green-50',
    medium: 'border-yellow-300 bg-yellow-50',
    low: 'border-gray-300 bg-gray-50'
  };

  const handleClick = () => {
    // TODO: Implement navigation to trading page
    console.log('Trading suggestion clicked:', suggestion);
  };

  return (
    <button
      onClick={handleClick}
      className={clsx(
        'w-full p-2 rounded border text-left transition-all hover:shadow-sm',
        priorityColors[suggestion.ui.priority]
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-800">{suggestion.ui.title}</p>
          <p className="text-xs text-gray-500">{suggestion.ui.subtitle}</p>
        </div>
        <span className="text-xs font-medium text-blue-600">{suggestion.ui.ctaText} →</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">{suggestion.reasoning}</p>
    </button>
  );
});

interface SnippetCardProps {
  snippet: KeywordSnippet;
}

const SnippetCard = memo<SnippetCardProps>(({ snippet }) => {
  const highlightedText = useMemo(() => {
    const text = snippet.text;
    const keywordsLower = snippet.keywords.map(k => k.toLowerCase());
    const pattern = new RegExp(`\\b(${snippet.keywords.map(k => escapeRegex(k)).join('|')})\\b`, 'gi');
    const parts = text.split(pattern);

    return parts.map((part, i) => {
      if (keywordsLower.includes(part.toLowerCase())) {
        return (
          <mark key={i} className="bg-yellow-200 px-0.5 rounded">
            {part}
          </mark>
        );
      }

      return part;
    });
  }, [snippet]);

  return (
    <div className="p-2 bg-white rounded border border-gray-200 text-xs text-gray-600 leading-relaxed">
      "{highlightedText}"
    </div>
  );
});

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface KeywordTagProps {
  keyword: string;
  category: KeywordCategory;
  count: number;
}

const KeywordTag = memo<KeywordTagProps>(({ keyword, category, count }) => {
  const categoryColors: Record<KeywordCategory, string> = {
    cryptocurrency: 'bg-orange-100 text-orange-700 border-orange-200',
    blockchain: 'bg-blue-100 text-blue-700 border-blue-200',
    defi: 'bg-purple-100 text-purple-700 border-purple-200',
    nft: 'bg-pink-100 text-pink-700 border-pink-200',
    exchange: 'bg-green-100 text-green-700 border-green-200',
    wallet: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    trading: 'bg-red-100 text-red-700 border-red-200',
    staking: 'bg-teal-100 text-teal-700 border-teal-200',
    layer2: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    web3: 'bg-violet-100 text-violet-700 border-violet-200'
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        categoryColors[category]
      )}
      title={`${category} • ${count}x`}
    >
      {keyword}
      {count > 1 && <span className="ml-1 opacity-60">×{count}</span>}
    </span>
  );
});

function formatKeyword(keyword: string): string {
  const upperCaseKeywords = new Set([
    'btc',
    'eth',
    'xtz',
    'sol',
    'ada',
    'dot',
    'avax',
    'matic',
    'xrp',
    'doge',
    'ltc',
    'link',
    'uni',
    'mkr',
    'atom',
    'algo',
    'ftm',
    'arb',
    'apt',
    'sui',
    'usdt',
    'usdc',
    'dai',
    'busd',
    'nft',
    'defi',
    'dex',
    'amm',
    'tvl',
    'apr',
    'apy',
    'cex',
    'pow',
    'pos',
    'dao',
    'ico',
    'ido',
    'ieo',
    'p2e',
    'l2',
    'ath',
    'atl',
    'fomo',
    'fud',
    'pfp',
    'okx',
    'ftx'
  ]);

  if (upperCaseKeywords.has(keyword.toLowerCase())) {
    return keyword.toUpperCase();
  }

  return keyword.charAt(0).toUpperCase() + keyword.slice(1);
}
