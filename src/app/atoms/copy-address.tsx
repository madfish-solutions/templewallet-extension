import React, { memo } from 'react';

import clsx from 'clsx';

import { ReactComponent as CopyIcon } from 'app/icons/base/copy.svg';
import { useCopyText } from 'lib/ui/hooks/use-copy-text';

import HashShortView from './HashShortView';
import { IconBase } from './IconBase';

interface CopyAddressProps {
  address: string;
  className?: string;
  firstCharsCount?: number;
  showCopyIcon?: boolean;
  textClassName?: string;
}

export const CopyAddress = memo<CopyAddressProps>(
  ({ address, showCopyIcon = true, textClassName, className, firstCharsCount }) => (
    <div className={clsx('flex flex-row items-center cursor-pointer', className)} onClick={useCopyText(address, true)}>
      <span className={clsx('text-font-description text-grey-1 group-hover:text-secondary', textClassName)}>
        <HashShortView hash={address} firstCharsCount={firstCharsCount} />
      </span>
      {showCopyIcon && (
        <IconBase Icon={CopyIcon} size={12} className="ml-0.5 text-secondary hidden group-hover:block" />
      )}
    </div>
  )
);
