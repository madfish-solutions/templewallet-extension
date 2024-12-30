import React, { FC, memo } from 'react';

import clsx from 'clsx';

import { ReactComponent as LoaderIcon } from 'app/icons/loader.svg';

import LoaderStyles from './loader.module.css';

type Size = 'L' | 'M' | 'S';

interface Props {
  trackVariant: 'dark' | 'light';
  size: Size;
  className?: string;
}

const SIZE_CLASSNAME: Record<Size, string> = {
  L: 'w-6 h-6',
  M: 'w-5 h-5',
  S: 'w-4 h-4'
};

export const Loader = memo<Props>(({ size, trackVariant, className }) => (
  <LoaderIcon
    className={clsx(
      SIZE_CLASSNAME[size],
      'fill-current animate-spin',
      trackVariant === 'light' ? LoaderStyles.trackLight : LoaderStyles.trackDark,
      className
    )}
  />
));

interface PageLoaderProps {
  text?: string;
  stretch?: boolean;
  className?: string;
}

export const PageLoader: FC<PageLoaderProps> = ({ text, stretch, className }) => (
  <div className={clsx('w-full flex flex-col items-center', stretch && 'flex-grow justify-center', className)}>
    <div
      className={clsx(
        'w-12 h-12 flex items-center justify-center',
        'bg-white border border-grey-4 rounded-lg shadow-center'
      )}
    >
      <Loader size="L" trackVariant="dark" className="text-secondary" />
    </div>

    {text && (
      <div className="p-4">
        <span className="text-font-description-bold text-grey-2">{text}</span>
      </div>
    )}
  </div>
);
