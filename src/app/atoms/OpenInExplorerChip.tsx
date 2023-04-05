import React, { FC, useMemo } from 'react';

import classNames from 'clsx';

import { ReactComponent as ArrowRightTopIcon } from 'app/icons/arrow-right-top.svg';
import useTippy from 'lib/ui/useTippy';

import { Anchor } from './Anchor';
import { OpenInExplorerChipSelectors } from './OpenInExplorerChip.selectors';

type OpenInExplorerChipProps = {
  baseUrl: string;
  hash: string;
  className?: string;
  bgShade?: 100 | 200;
  textShade?: 500 | 600 | 700;
  rounded?: 'sm' | 'base';
};

const OpenInExplorerChip: FC<OpenInExplorerChipProps> = ({
  baseUrl,
  hash,
  className,
  bgShade = 100,
  textShade = 600,
  rounded = 'sm'
}) => {
  const tippyProps = useMemo(
    () => ({
      trigger: 'mouseenter',
      hideOnClick: false,
      content: 'View on block explorer',
      animation: 'shift-away-subtle'
    }),
    []
  );

  const ref = useTippy<HTMLAnchorElement>(tippyProps);

  return (
    <Anchor
      ref={ref}
      href={`${baseUrl}/${hash}`}
      className={classNames(
        (() => {
          switch (bgShade) {
            case 100:
              return 'bg-gray-100 hover:bg-gray-200';

            case 200:
              return 'bg-gray-200 hover:bg-gray-300';
          }
        })(),
        (() => {
          switch (textShade) {
            case 500:
              return 'text-gray-500';

            case 600:
              return 'text-gray-600';

            case 700:
              return 'text-gray-700';
          }
        })(),
        rounded === 'base' ? 'rounded' : 'rounded-sm',
        'leading-none select-none',
        'transition ease-in-out duration-300',
        'flex items-center justify-center',
        className
      )}
      testID={OpenInExplorerChipSelectors.ViewOnBlockExplorerLink}
      treatAsButton={true}
    >
      <ArrowRightTopIcon className="h-5 w-auto fill-current" />
    </Anchor>
  );
};

export default OpenInExplorerChip;
