import React, { FC } from 'react';

import clsx from 'clsx';

import { ReactComponent as SadSearchIcon } from 'app/icons/monochrome/sad-search.svg';
import { ReactComponent as SadUniversalIcon } from 'app/icons/monochrome/sad-universal.svg';
import { T, TID } from 'lib/i18n';

interface EmptyStateProps {
  forSearch?: boolean;
  textI18n?: TID;
  text?: string;
  stretch?: boolean;
  iconSize?: number;
}

export const EmptyState: FC<EmptyStateProps> = ({ forSearch = true, textI18n, text, stretch, iconSize }) => {
  const Icon = forSearch ? SadSearchIcon : SadUniversalIcon;

  const textElem = textI18n ? <T id={textI18n} /> : (text ?? <T id="notFound" />);

  return (
    <div className={clsx('w-full pt-3 pb-4 flex flex-col items-center gap-2', stretch && 'flex-grow justify-center')}>
      <Icon className="fill-grey-3 stroke-grey-3" style={{ width: iconSize ?? 92 }} />

      {textElem ? <span className="text-center text-font-medium-bold text-grey-2">{textElem}</span> : null}
    </div>
  );
};
