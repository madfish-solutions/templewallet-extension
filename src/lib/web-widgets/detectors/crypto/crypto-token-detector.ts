import type { CoinIndex } from 'lib/temple/back/web-widgets/fetch-coin-index';

import type { DetectedRef, Detector, TagData, TickerRef } from '../../engine/types';
import * as messaging from '../../messaging';

import { detectTickers } from './detect-tickers';
import { extractPostText } from './extract-post-text';

const DETECTOR_ID = 'crypto-token';
const INDEX_TTL_MS = 10 * 60 * 1000;

let indexPromise: Promise<CoinIndex> | null = null;
let fetchedAt = 0;

const getCoinIndexCached = (): Promise<CoinIndex> => {
  if (!indexPromise || Date.now() - fetchedAt > INDEX_TTL_MS) {
    fetchedAt = Date.now();
    indexPromise = messaging
      .getCoinIndex()
      .then(index => {
        if (!index || Object.keys(index).length === 0) {
          indexPromise = null;
          fetchedAt = 0;
        }
        return index ?? {};
      })
      .catch(error => {
        indexPromise = null;
        fetchedAt = 0;
        throw error;
      });
  }

  return indexPromise;
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

    const index = await getCoinIndexCached();
    const coin = index[ref.symbol];
    if (!coin) return null;

    const tagData: TagData = { kind: 'ticker', iconUrl: coin.iconUrl, label: coin.symbol };

    if (tagData.iconUrl) {
      const dataUrl = await messaging.fetchThumbnailBlob(tagData.iconUrl);
      if (dataUrl) tagData.iconUrl = dataUrl;
    }

    return tagData;
  }
};
