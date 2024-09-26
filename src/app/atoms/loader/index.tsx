import React, { memo } from 'react';

import clsx from 'clsx';

import { ReactComponent as LoaderIcon } from 'app/icons/loader.svg';

import LoaderStyles from './loader.module.css';

type Size = 'L' | 'M' | 'S';

interface LoaderProps {
  trackVariant: 'dark' | 'light';
  size: Size;
}

const SIZE_CLASSNAME: Record<Size, string> = {
  L: 'w-6 h-6',
  M: 'w-5 h-5',
  S: 'w-4 h-4'
};

export const Loader = memo<LoaderProps>(({ trackVariant, size }) => (
  <LoaderIcon
    className={clsx(
      SIZE_CLASSNAME[size],
      'fill-current animate-spin',
      trackVariant === 'light' ? LoaderStyles.trackLight : LoaderStyles.trackDark
    )}
  />
));
