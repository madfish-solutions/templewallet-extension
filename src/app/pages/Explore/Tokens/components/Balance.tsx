import React, { memo } from 'react';

import BigNumber from 'bignumber.js';

import Money from 'app/atoms/Money';
import InFiat from 'app/templates/InFiat';

interface Props {
  assetSlug: string;
  /** Float number */
  value: BigNumber;
  inFiat?: boolean;
}

export const Balance = memo<Props>(({ assetSlug, value, inFiat = false }) =>
  inFiat ? (
    <InFiat assetSlug={assetSlug} volume={value} smallFractionFont={false}>
      {({ balance, symbol }) => (
        <div className="ml-1 font-normal text-gray-500 text-xs flex items-center text-right truncate text-right">
          <span className="mr-1">≈</span>
          {balance}
          <span className="ml-1">{symbol}</span>
        </div>
      )}
    </InFiat>
  ) : (
    <div className="truncate text-base font-medium text-gray-800 text-right ml-4 flex-1 flex justify-end">
      <Money smallFractionFont={false}>{value}</Money>
    </div>
  )
);
