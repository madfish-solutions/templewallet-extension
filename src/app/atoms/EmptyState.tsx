import React, { memo } from 'react';

import clsx from 'clsx';

import { ReactComponent as SadSearchIcon } from 'app/icons/monochrome/sad-search.svg';
import { ReactComponent as SadUniversalIcon } from 'app/icons/monochrome/sad-universal.svg';
import { T } from 'lib/i18n';

interface EmptyStateProps {
  variant: 'tokenSearch' | 'universal' | 'searchUniversal';
  showText?: boolean;
  iconSize?: 60 | 92;
  className?: string;
}

export const EmptyState = memo<EmptyStateProps>(({ className, variant, showText = true, iconSize = 92 }) => (
  <div className={clsx(className, 'w-full py-7 flex-grow flex flex-col justify-center items-center gap-2')}>
    {variant === 'universal' ? (
      <SadUniversalIcon style={{ width: iconSize, height: iconSize }} />
    ) : (
      <SadSearchIcon style={{ width: iconSize, height: iconSize }} />
    )}
    {showText && (
      <span className="text-font-medium-bold text-grey-2">
        <T id={variant === 'tokenSearch' ? 'tokensNotFound' : 'notFound'} />
      </span>
    )}
  </div>
));
