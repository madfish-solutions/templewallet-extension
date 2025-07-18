// Original: https://github.com/dicebear/dicebear/blob/8.x/packages/%40dicebear/initials/src/index.ts

import type { StyleCreate, StyleMeta } from '@dicebear/core';

import { convertColor } from './convertColor';
import type { Options } from './types';

export const meta: StyleMeta = {
  title: 'Initials',
  creator: 'DiceBear',
  source: 'https://github.com/dicebear/dicebear',
  license: {
    name: 'CC0 1.0',
    url: 'https://creativecommons.org/publicdomain/zero/1.0/'
  }
};

export const create: StyleCreate<Options> = ({ prng, options }) => {
  const fontFamily = options.fontFamily?.join(', ') ?? 'Arial, sans-serif';
  const fontSize = options.fontSize ?? 50;
  const fontWeight = options.fontWeight ?? 400;
  const textColor = convertColor(prng.pick(options.textColor ?? []) ?? 'ffffff');
  const initials = prng.seed.trim().slice(0, options.chars ?? 2);

  // prettier-ignore
  const svg = [
    `<text x="50%" y="50%" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${textColor}" text-anchor="middle" dy="${(fontSize * .356).toFixed(3)}">${initials}</text>`,
  ].join('');

  return {
    attributes: {
      viewBox: '0 0 100 100'
    },
    body: svg,
    extra: () => ({
      fontFamily,
      fontSize,
      fontWeight,
      textColor,
      initials
    })
  };
};

export { schema } from './schema';
export type { Options } from './types';
