import React, { CSSProperties, memo } from 'react';

import clsx from 'clsx';

import { ReactComponent as SearchEmptyIcon } from 'app/icons/search_empty.svg';
import { TID, T } from 'lib/i18n';

type Sizes = 'small' | 'large';

interface Props {
  className?: string;
  textI18nKey?: TID;
  iconSize?: Sizes;
  showText?: boolean;
}

const ICON_SIZES: Record<Sizes, CSSProperties> = {
  large: {
    width: 92,
    height: 92
  },
  small: {
    width: 60,
    height: 60
  }
};

export const EmptyState = memo<Props>(
  ({ className, textI18nKey = 'notFound', iconSize = 'large', showText = true }) => (
    <div className={clsx('flex-grow flex flex-col items-center justify-center gap-y-2 py-7 px-2.5', className)}>
      <SearchEmptyIcon className="stroke-current fill-current text-grey-3" style={ICON_SIZES[iconSize]} />

      {showText && (
        <span className="text-font-medium-bold text-grey-2">
          <T id={textI18nKey} />
        </span>
      )}
    </div>
  )
);
