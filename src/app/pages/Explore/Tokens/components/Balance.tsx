import React, { memo } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import Money from 'app/atoms/Money';
import InFiat from 'app/templates/InFiat';

type BalanceProps = {
  assetSlug: string;
  latestBalance: BigNumber;
  inFiat?: boolean;
};

const Balance = memo<BalanceProps>(({ assetSlug, latestBalance, inFiat = false }) =>
  inFiat ? (
    <InFiat assetSlug={assetSlug} volume={latestBalance} smallFractionFont={false}>
      {({ balance, symbol }) => (
        <div
          className={classNames(
            'ml-1',
            'font-normal text-gray-500 text-xs flex items-center text-right truncate text-right'
          )}
        >
          <span className="mr-1">≈</span>
          {balance}
          <span className="ml-1">{symbol}</span>
        </div>
      )}
    </InFiat>
  ) : (
    <div className="truncate text-base font-medium text-gray-800 text-right ml-4 flex-1 flex justify-end">
      <Money smallFractionFont={false}>{latestBalance}</Money>
    </div>
  )
);

export default Balance;
