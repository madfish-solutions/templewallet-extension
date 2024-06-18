import React, { HTMLAttributes, memo, useMemo } from 'react';

import * as botttsNeutral from '@dicebear/bottts-neutral';
import { createAvatar } from '@dicebear/core';
import clsx from 'clsx';
import * as jdenticon from 'jdenticon';
import memoizee from 'memoizee';

import * as firstLetters from 'lib/first-letters';

type IdenticonProps = HTMLAttributes<HTMLDivElement> & {
  type?: 'jdenticon' | 'botttsneutral' | 'initials';
  hash: string;
  size?: number;
};

const MAX_INITIALS_LENGTH = 5;
const DEFAULT_FONT_SIZE = 50;

const getBackgroundImageUrl = memoizee(
  (hash: string, size: number, type: NonNullable<IdenticonProps['type']>) => {
    switch (type) {
      case 'jdenticon':
        return `data:image/svg+xml,${encodeURIComponent(jdenticon.toSvg(hash, size))}`;
      case 'botttsneutral':
        return createAvatar(botttsNeutral, { seed: hash, size }).toDataUriSync();
      default:
        return createAvatar(firstLetters, {
          seed: hash,
          size,
          fontFamily: ['Menlo', 'Monaco', 'monospace'],
          fontSize: estimateOptimalFontSize(hash.length),
          chars: MAX_INITIALS_LENGTH
        }).toDataUriSync();
    }
  },
  { max: 1024 }
);

export const Identicon = memo<IdenticonProps>(
  ({ type = 'jdenticon', hash, size = 100, className, style = {}, ...rest }) => {
    const backgroundImage = useMemo(() => getBackgroundImageUrl(hash, size, type), [hash, size, type]);

    return (
      <div
        className={clsx(
          'inline-block',
          type === 'initials' ? 'bg-transparent' : 'bg-white',
          'bg-no-repeat bg-center',
          'overflow-hidden',
          className
        )}
        style={style}
        {...rest}
      >
        <img src={backgroundImage} alt="" style={{ width: size, height: size }} />
      </div>
    );
  }
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
