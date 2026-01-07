import React, { FC } from 'react';

import Money from 'app/atoms/Money';
import { atomsToTokens } from 'lib/temple/helpers';

interface Props {
  minimumReceivedAmount?: BigNumber;
  outputAssetSymbol: string;
  outputAssetDecimals: number;
}

export const SwapMinimumReceived: FC<Props> = ({ minimumReceivedAmount, outputAssetSymbol, outputAssetDecimals }) => {
  return (
    <span className="flex items-end justify-end">
      {minimumReceivedAmount ? (
        <>
          <Money smallFractionFont={false} fiat={false}>
            {atomsToTokens(minimumReceivedAmount, outputAssetDecimals)}
          </Money>
          <span className="ml-1">{outputAssetSymbol}</span>
        </>
      ) : (
        '-'
      )}
    </span>
  );
};
