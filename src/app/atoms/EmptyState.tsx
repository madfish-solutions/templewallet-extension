import React, { CSSProperties, memo } from 'react';

import clsx from 'clsx';

import { ReactComponent as SearchEmptyIcon } from 'app/icons/search_empty.svg';
import { TID, T } from 'lib/i18n';

interface Props {
  className?: string;
  textI18nKey?: TID;
}

const ICON_STYLE: CSSProperties = {
  width: 92,
  height: 92
};

export const EmptyState = memo<Props>(({ className, textI18nKey = 'notFound' }) => {
  return (
    <div className={clsx('flex flex-col items-center justify-center gap-y-2 py-8 px-2.5', className)}>
      <SearchEmptyIcon className="stroke-current fill-current text-grey-3" style={ICON_STYLE} />

      <span className="text-font-medium-bold text-grey-2">
        <T id={textI18nKey} />
      </span>
    </div>
  );
});
