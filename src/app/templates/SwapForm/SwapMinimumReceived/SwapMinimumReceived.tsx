import React, { FC, useMemo } from 'react';

import { Trade } from 'swap-router-sdk';

import Money from 'app/atoms/Money';
import { AssetMetadata } from 'lib/temple/front';
import { atomsToTokens } from 'lib/temple/helpers';

interface Props {
  tradeWithSlippageTolerance: Trade;
  outputAssetMetadata: AssetMetadata;
}

export const SwapMinimumReceived: FC<Props> = ({ tradeWithSlippageTolerance, outputAssetMetadata }) => {
  const minimumReceivedAmount = useMemo(() => {
    if (tradeWithSlippageTolerance.length > 0) {
      const lastTradeOperation = tradeWithSlippageTolerance[tradeWithSlippageTolerance.length - 1];

      return atomsToTokens(lastTradeOperation.bTokenAmount, outputAssetMetadata.decimals);
    }
    return undefined;
  }, [tradeWithSlippageTolerance, outputAssetMetadata.decimals]);

  return (
    <span>
      {minimumReceivedAmount ? (
        <>
          <Money smallFractionFont={false} fiat={false}>
            {minimumReceivedAmount}
          </Money>
          <span> {outputAssetMetadata.symbol}</span>
        </>
      ) : (
        '-'
      )}
    </span>
  );
};
