import React, { FC, useMemo } from 'react';

import clsx from 'clsx';

import { ReactComponent as ArrowTopRightSvgIcon } from 'app/icons/arrow-top-right.svg';
import { ReactComponent as LinkSvgIcon } from 'app/icons/external-link.svg';
import type { TestIDProps } from 'lib/analytics';
import useTippy, { UseTippyOptions } from 'lib/ui/useTippy';

import { Anchor } from './Anchor';

export interface ExternalLinkChipProps extends TestIDProps {
  href: string;
  tooltip?: string;
  className?: string;
  alternativeDesign?: boolean;
  arrowIcon?: boolean;
  small?: boolean;
}

export const ExternalLinkChip: FC<ExternalLinkChipProps> = ({
  href,
  tooltip,
  className,
  arrowIcon,
  small,
  alternativeDesign,
  testID,
  testIDProperties
}) => {
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

  const SvgIcon = arrowIcon ? ArrowTopRightSvgIcon : LinkSvgIcon;

  return (
    <Anchor
      ref={tooltip ? ref : undefined}
      href={href}
      className={clsx(
        'flex items-center justify-center rounded-sm select-none p-1',
        'bg-gray-100 hover:bg-gray-200 transition ease-in-out duration-300',
        alternativeDesign
          ? 'text-gray-500 bg-gray-200 hover:bg-gray-300'
          : 'text-gray-600 bg-gray-100 hover:bg-gray-200',
        className
      )}
      treatAsButton={true}
      testID={testID}
      testIDProperties={testIDProperties}
    >
      <SvgIcon className={clsx('stroke-current fill-current', small ? 'h-3 w-3' : 'h-4 w-4')} />
    </Anchor>
  );
};
