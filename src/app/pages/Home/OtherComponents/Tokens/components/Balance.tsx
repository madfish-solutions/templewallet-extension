import React, { memo } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';

import Money from 'app/atoms/Money';
import InFiat from 'app/templates/InFiat';
import { TestIDProps } from 'lib/analytics';
import { ASSET_HUGE_AMOUNT } from 'lib/constants';

interface CryptoBalanceProps extends TestIDProps {
  value: BigNumber;
}

export const CryptoBalance = memo<CryptoBalanceProps>(({ value, testID, testIDProperties }) => (
  <div className={clsx(value.lt(ASSET_HUGE_AMOUNT) ? 'shrink-0' : 'overflow-hidden text-ellipsis', 'text-font-num-14')}>
    <Money smallFractionFont={false} testID={testID} testIDProperties={testIDProperties}>
      {value}
    </Money>
  </div>
));

interface FiatBalanceProps extends CryptoBalanceProps {
  chainId: number | string;
  assetSlug: string;
  evm?: boolean;
}

export const FiatBalance = memo<FiatBalanceProps>(
  ({ evm = false, chainId, assetSlug, value, testID, testIDProperties }) => (
    <InFiat
      evm={evm}
      chainId={chainId}
      assetSlug={assetSlug}
      volume={value}
      smallFractionFont={false}
      testID={testID}
      testIDProperties={testIDProperties}
    >
      {({ balance, symbol }) => (
        <div className="shrink-0 text-font-num-12 text-grey-1">
          {balance}
          <span className="ml-1">{symbol}</span>
        </div>
      )}
    </InFiat>
  )
);
