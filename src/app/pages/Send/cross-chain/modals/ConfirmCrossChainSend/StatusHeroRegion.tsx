import React, { FC, ReactNode, memo } from 'react';

import clsx from 'clsx';

interface Props {
  backgroundSrc: string;
  outerClassName?: string;
  innerClassName?: string;
  children: ReactNode;
}

export const StatusHeroRegion: FC<Props> = memo(({ backgroundSrc, outerClassName, innerClassName, children }) => (
  <div className={clsx('relative -mx-4 -mt-3 overflow-hidden', outerClassName)}>
    <div
      aria-hidden
      style={{ backgroundImage: `url(${backgroundSrc})` }}
      className="absolute inset-0 bg-no-repeat bg-cover bg-center pointer-events-none"
    />
    <div className={clsx('relative', innerClassName)}>{children}</div>
  </div>
));
