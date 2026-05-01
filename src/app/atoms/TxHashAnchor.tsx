import React, { MouseEvent, memo, useCallback } from 'react';

import clsx from 'clsx';

import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';

import { Anchor } from './Anchor';
import HashShortView from './HashShortView';
import { IconBase } from './IconBase';

interface Props {
  href: string | null | undefined;
  hash: string;
  firstCharsCount?: number;
  lastCharsCount?: number;
  className?: string;
  stopPropagation?: boolean;
}

export const TxHashAnchor = memo<Props>(
  ({ href, hash, firstCharsCount = 6, lastCharsCount = 4, className, stopPropagation = true }) => {
    const handleClick = useCallback(
      (e: MouseEvent) => {
        if (stopPropagation) e.stopPropagation();
      },
      [stopPropagation]
    );

    return (
      <Anchor
        href={href ?? undefined}
        target="_blank"
        onClick={handleClick}
        className={clsx('flex items-center gap-x-1 group-hover:text-secondary', className)}
      >
        <span>
          <HashShortView hash={hash} firstCharsCount={firstCharsCount} lastCharsCount={lastCharsCount} />
        </span>
        <IconBase Icon={OutLinkIcon} size={12} className="invisible group-hover:visible" />
      </Anchor>
    );
  }
);
