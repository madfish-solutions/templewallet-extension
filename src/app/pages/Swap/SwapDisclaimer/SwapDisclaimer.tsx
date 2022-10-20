import React, { FC } from 'react';

import classNames from 'clsx';

import { ReactComponent as InfoIcon } from 'app/icons/info.svg';
import { T } from 'lib/i18n';
import useTippy from 'lib/ui/useTippy';

import { swapDisclaimerTippyProps } from './SwapDisclaimer.tippy';

export const SwapDisclaimer: FC = () => {
  const tippyRef = useTippy<HTMLSpanElement>(swapDisclaimerTippyProps);

  return (
    <div className="mb-4 flex items-center">
      <span
        ref={tippyRef}
        className={classNames(
          'inline-flex items-center',
          '-ml-1 p-1',
          'cursor-default',
          'text-xs',
          'rounded-sm',
          'text-gray-600 hover:bg-gray-100'
        )}
      >
        <T id="swapDisclaimerTitle" />
        <InfoIcon
          style={{
            width: '0.625rem',
            height: 'auto',
            marginLeft: '0.125rem'
          }}
          className="stroke-current"
        />
      </span>
    </div>
  );
};
