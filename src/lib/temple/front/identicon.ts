import * as botttsNeutral from '@dicebear/bottts-neutral';
import { Options, createAvatar } from '@dicebear/core';
import * as jdenticon from 'jdenticon';
import memoizee from 'memoizee';

import * as firstLetters from 'lib/first-letters';

export type IdenticonType = 'jdenticon' | 'botttsneutral' | 'initials';

export type IdenticonOptions<T extends IdenticonType> = T extends 'jdenticon'
  ? Omit<Options, 'size' | 'seed'>
  : T extends 'botttsneutral'
  ? Omit<botttsNeutral.Options & Options, 'size' | 'seed'>
  : Omit<firstLetters.Options & Options, 'size' | 'seed'>;

const MAX_INITIALS_LENGTH = 5;
const DEFAULT_FONT_SIZE = 50;

function internalGetIdenticonUri<T extends IdenticonType>(
  hash: string,
  size: number,
  type: T,
  options?: IdenticonOptions<T>
) {
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
        ...options
      }).toDataUriSync();
  }
}

export const getIdenticonUri = memoizee(internalGetIdenticonUri, {
  max: 1024,
  normalizer: ([hash, size, type, options]) => JSON.stringify([hash, size, type, options])
});

/**
 * Dicebear renders letters in a viewbox of 100x100 with a font size that is returned by this function. Let's ensure
 * that the label with the horizontal padding of 5 and at most 5 characters fits into a circle of radius 50 but
 * the font size is not greater than 50. According to the Pythagorean theorem, the font size should be equal to the
 * root of the equation, where MENLO_LETTER_RATIO is the ratio of the width of a letter to its height in Menlo font:
 * (HORIZONTAL_PADDING + n * x * MENLO_LETTER_RATIO / 2) ** 2 + (x / 2) ** 2 = (BOX_SIZE / 2) ** 2.
 * Menlo font is monospace, letter width is 1233 units, and the letter height is 2048 units.
 * We should take the positive root of the equation and round it to floor. However, it is greater than 50
 * for 1 or 2 characters.
 */
const precalculatedFontSizes = new Map<number, number>([
  [3, 44],
  [4, 34],
  [5, 28]
]);

function estimateOptimalFontSize(length: number) {
  return precalculatedFontSizes.get(Math.min(length, MAX_INITIALS_LENGTH)) ?? DEFAULT_FONT_SIZE;
}
