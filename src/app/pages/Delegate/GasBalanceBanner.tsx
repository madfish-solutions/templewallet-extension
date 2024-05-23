import React, { memo } from 'react';

import BigNumber from 'bignumber.js';

import Money from 'app/atoms/Money';
import InFiat from 'app/templates/InFiat';
import { useGasTokenMetadata } from 'lib/metadata';

interface Props {
  balance: BigNumber;
}

export const GasBalanceBanner = memo<Props>(({ balance }) => {
  const { symbol, thumbnailUri } = useGasTokenMetadata();

  return (
    <div className="mb-6 border rounded-md p-2 flex items-center">
      <img src={thumbnailUri} alt={symbol} className="w-auto h-12 mr-3" />

      <div className="flex flex-col font-light leading-none">
        <span className="text-xl text-gray-700 flex items-baseline">
          <Money>{balance}</Money>{' '}
          <span style={{ fontSize: '0.75em' }}>
            <span className="ml-1">{symbol}</span>
          </span>
        </span>

        <InFiat assetSlug="tez" volume={balance}>
          {({ balance, symbol }) => (
            <div className="mt-1 text-sm text-gray-500 flex items-baseline">
              {balance}
              <span className="ml-1">{symbol}</span>
            </div>
          )}
        </InFiat>
      </div>
    </div>
  );
});
