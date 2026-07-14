import type { CoinsBySymbol } from 'lib/temple/back/web-widgets/fetch-coins-by-symbol';

import type { DetectedRef, Detector, TagData, TickerRef } from '../../engine/types';
import * as messaging from '../../messaging';

import { detectTickers } from './detect-tickers';
import { extractPostText } from './extract-post-text';

const DETECTOR_ID = 'crypto-token';
const CACHE_TTL_MS = 10 * 60 * 1000;

let coinsPromise: Promise<CoinsBySymbol> | null = null;
let fetchedAt = 0;

const getCoinsBySymbolCached = (): Promise<CoinsBySymbol> => {
  if (!coinsPromise || Date.now() - fetchedAt > CACHE_TTL_MS) {
    fetchedAt = Date.now();
    coinsPromise = messaging
      .getCoinsBySymbol()
      .then(coins => {
        if (!coins || Object.keys(coins).length === 0) {
          coinsPromise = null;
          fetchedAt = 0;
        }
        return coins ?? {};
      })
      .catch(error => {
        coinsPromise = null;
        fetchedAt = 0;
        throw error;
      });
  }

  return coinsPromise;
};

export const cryptoTokenDetector: Detector = {
  id: DETECTOR_ID,

  scan(post: HTMLElement): DetectedRef[] {
    return detectTickers(extractPostText(post)).map<TickerRef>(match => ({
      kind: 'ticker',
      postEl: post,
      symbol: match.symbol,
      format: match.format
    }));
  },

  async resolve(ref: DetectedRef): Promise<TagData | null> {
    if (ref.kind !== 'ticker') return null;

    const coins = await getCoinsBySymbolCached();
    const coin = coins[ref.symbol];
    if (!coin) return null;

    const tagData: TagData = { kind: 'ticker', iconUrl: coin.iconUrl, label: coin.symbol };

    if (tagData.iconUrl) {
      const dataUrl = await messaging.fetchThumbnailBlob(tagData.iconUrl);
      if (dataUrl) tagData.iconUrl = dataUrl;
    }

    return tagData;
  }
};
