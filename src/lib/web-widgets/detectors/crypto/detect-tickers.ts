export interface TickerMatch {
  symbol: string;
  format: '$' | '#';
}

const TICKER_RE = /(?<![A-Za-z0-9$#])([$#])([A-Za-z0-9]{1,10})\b/g;
const HAS_LETTER = /[A-Za-z]/;

// Extracts unique cashtag/hashtag candidates (UPPERCASE), '$' winning format ties
export const detectTickers = (text: string): TickerMatch[] => {
  const bySymbol = new Map<string, TickerMatch>();

  for (const match of text.matchAll(TICKER_RE)) {
    const raw = match[2];
    if (!HAS_LETTER.test(raw)) continue;

    const symbol = raw.toUpperCase();
    const format: '$' | '#' = match[1] === '$' ? '$' : '#';
    const existing = bySymbol.get(symbol);

    if (!existing) {
      bySymbol.set(symbol, { symbol, format });
    } else if (existing.format === '#' && format === '$') {
      existing.format = '$';
    }
  }

  return [...bySymbol.values()];
};
