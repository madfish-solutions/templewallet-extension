import React, { FC, useMemo } from 'react';

import clsx from 'clsx';

import { ReactComponent as SvgIcon } from 'app/icons/external-link.svg';
import useTippy, { UseTippyOptions } from 'lib/ui/useTippy';

import { Anchor } from './Anchor';

type Props = {
  href: string;
  tooltip?: string;
  className?: string;
};

export const ExternalLinkChip: FC<Props> = ({ href, tooltip, className }) => {
  const tippyOptions = useMemo<UseTippyOptions>(
    () => ({
      trigger: 'mouseenter',
      hideOnClick: false,
      content: tooltip,
      animation: 'shift-away-subtle'
    }),
    [tooltip]
  );

  const ref = useTippy<HTMLAnchorElement>(tippyOptions);

  return (
    <Anchor
      ref={tooltip ? ref : undefined}
      href={href}
      className={clsx(
        'flex items-center justify-center rounded-sm select-none p-1',
        'bg-gray-100 hover:bg-gray-200 transition ease-in-out duration-300',
        className
      )}
      treatAsButton={true}
    >
      <SvgIcon className="h-4 w-4 stroke-current fill-current text-gray-600" />
    </Anchor>
  );
};
