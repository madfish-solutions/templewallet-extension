import * as botttsNeutral from '@dicebear/bottts-neutral';
import { Options, createAvatar } from '@dicebear/core';
import * as jdenticon from 'jdenticon';
import memoizee from 'memoizee';

import * as firstLetters from 'lib/first-letters';

export type IdenticonType = 'jdenticon' | 'botttsneutral' | 'initials';

const MAX_INITIALS_LENGTH = 5;
const DEFAULT_FONT_SIZE = 50;

export const getIdenticonUri = memoizee(
  (hash: string, size: number, type: NonNullable<IdenticonType>, options: Omit<Options, 'size' | 'seed'> = {}) => {
    switch (type) {
      case 'jdenticon':
        // TODO: implement options interpretation for jdenticon
        return `data:image/svg+xml,${encodeURIComponent(jdenticon.toSvg(hash, size))}`;
      case 'botttsneutral':
        return createAvatar(botttsNeutral, { seed: hash, size, ...options }).toDataUriSync();
      default:
        return createAvatar(firstLetters, {
          seed: hash,
          size,
          fontFamily: ['Menlo', 'Monaco', 'monospace'],
          fontSize: estimateOptimalFontSize(hash.length),
          chars: MAX_INITIALS_LENGTH,
          ...options
        }).toDataUriSync();
    }
  },
  { max: 1024, normalizer: ([hash, size, type, options]) => JSON.stringify([hash, size, type, options]) }
);

function estimateOptimalFontSize(length: number) {
  const initialsLength = Math.min(length, MAX_INITIALS_LENGTH);
  if (initialsLength > 2) {
    const n = initialsLength;
    const multiplier = Math.sqrt(10000 / ((32 * n + 4 * (n - 1)) ** 2 + 36 ** 2));
    return Math.floor(DEFAULT_FONT_SIZE * multiplier);
  }
  return DEFAULT_FONT_SIZE;
}
