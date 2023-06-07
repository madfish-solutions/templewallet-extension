import React, { FC } from 'react';

import { BigNumber } from 'bignumber.js';

import Money from 'app/atoms/Money';
import { AssetMetadataBase } from 'lib/metadata';
import { atomsToTokens } from 'lib/temple/helpers';

interface Props {
  minimumReceivedAmount?: BigNumber;
  outputAssetMetadata: AssetMetadataBase;
}

export const SwapMinimumReceived: FC<Props> = ({ minimumReceivedAmount, outputAssetMetadata }) => {
  return (
    <span className="flex items-end justify-end">
      {minimumReceivedAmount ? (
        <>
          <Money smallFractionFont={false} fiat={false}>
            {atomsToTokens(minimumReceivedAmount, outputAssetMetadata.decimals)}
          </Money>
          <span className="ml-1">{outputAssetMetadata.symbol}</span>
        </>
      ) : (
        '-'
      )}
    </span>
  );
};
