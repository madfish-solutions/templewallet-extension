import React, { memo } from 'react';

import clsx from 'clsx';

import { ReactComponent as SadSearchIcon } from 'app/icons/monochrome/sad-search.svg';
import { ReactComponent as SadUniversalIcon } from 'app/icons/monochrome/sad-universal.svg';
import { T, TID } from 'lib/i18n';

interface EmptyStateProps {
  forSearch?: boolean;
  textI18n?: TID;
  text?: string;
  stretch?: boolean;
}

export const EmptyState = memo<EmptyStateProps>(({ forSearch = true, textI18n, text, stretch }) => {
  const Icon = forSearch ? SadSearchIcon : SadUniversalIcon;

  return (
    <div className={clsx('w-full py-7 flex flex-col items-center gap-2', stretch && 'flex-grow justify-center')}>
      <Icon className="w-[92px] fill-grey-3 stroke-grey-3" />

      <span className="text-font-medium-bold text-grey-2">
        {textI18n ? <T id={textI18n} /> : text || <T id="notFound" />}
      </span>
    </div>
  );
});
