import React, { FC } from 'react';

import { BigNumber } from 'bignumber.js';

import Money from 'app/atoms/Money';
import { AssetMetadata } from 'lib/temple/front';

interface Props {
  minimumReceivedAmount: BigNumber;
  outputAssetMetadata: AssetMetadata;
}

export const SwapMinimumReceived: FC<Props> = ({ minimumReceivedAmount, outputAssetMetadata }) => {
  return (
    <span className="flex items-end justify-end">
      {minimumReceivedAmount ? (
        <>
          <Money smallFractionFont={false} fiat={false}>
            {minimumReceivedAmount}
          </Money>
          <span className="ml-1">{outputAssetMetadata.symbol}</span>
        </>
      ) : (
        '-'
      )}
    </span>
  );
};
