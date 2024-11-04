import React, { memo } from 'react';

import BigNumber from 'bignumber.js';

import InFiat from 'app/templates/InFiat';

import Money from './Money';

interface Props {
  chainId: string | number;
  assetSlug: string;
  assetSymbol?: string;
  amountValue: string;
  toFiat: boolean;
  evm?: boolean;
}

export const ConvertedInputAssetAmount = memo<Props>(
  ({ chainId, assetSlug, assetSymbol, amountValue, toFiat, evm }) => {
    if (toFiat)
      return (
        <InFiat
          chainId={chainId}
          assetSlug={assetSlug}
          volume={amountValue}
          smallFractionFont={false}
          roundingMode={BigNumber.ROUND_FLOOR}
          evm={evm}
        >
          {({ balance, symbol }) => (
            <div className="flex items-baseline text-font-num-12 text-grey-1">
              <span>≈</span>
              <span className="mx-1">{balance}</span>
              <span>{symbol}</span>
            </div>
          )}
        </InFiat>
      );

    return (
      <div className="flex items-baseline text-font-num-12 text-grey-1">
        <span className="mr-0.5">≈</span>
        <Money smallFractionFont={false} tooltipPlacement="bottom">
          {amountValue}
        </Money>
        <span className="ml-1 truncate">{assetSymbol}</span>
      </div>
    );
  }
);
