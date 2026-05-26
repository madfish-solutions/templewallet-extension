/**
 * Future crypto detector for the (x.com) addable with only this file
 * and `registry.register(cryptoTokenDetector)` line in bootstrap.ts
 */

import type { DetectedRef, Detector, TagData } from '../../engine/types';

const DETECTOR_ID = 'crypto-token';

// Matches `$TICKER` style (1-10 uppercase letters/digits, leading letter)
const CASHTAG_RE = /\$[A-Z][A-Z0-9]{0,9}\b/g;

export const cryptoTokenDetector: Detector = {
  id: DETECTOR_ID,

  scan(post: HTMLElement): DetectedRef[] {
    const text = post.textContent ?? '';
    const refs: DetectedRef[] = [];

    for (const match of text.matchAll(CASHTAG_RE)) {
      refs.push({ detectorId: DETECTOR_ID, sourceHref: match[0], postEl: post });
    }

    return refs;
  },

  async resolve(_ref: DetectedRef): Promise<TagData | null> {
    // real crypto-token resolution (background metadata lookup) will be later;
    // Returning null means no pill is painted
    return null;
  }
};
