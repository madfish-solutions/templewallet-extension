import React, { FC, useMemo } from 'react';

import { getTradeInputAmount, getTradeOutputAmount, Trade } from 'swap-router-sdk';

import Money from 'app/atoms/Money';
import { atomsToTokens } from 'lib/temple/helpers';
import type { AssetMetadata } from 'lib/temple/metadata/types';

interface Props {
  trade: Trade;
  inputAssetMetadata: AssetMetadata;
  outputAssetMetadata: AssetMetadata;
}

export const SwapExchangeRate: FC<Props> = ({ trade, inputAssetMetadata, outputAssetMetadata }) => {
  const exchangeRate = useMemo(() => {
    const tradeMutezInput = getTradeInputAmount(trade);
    const tradeMutezOutput = getTradeOutputAmount(trade);

    if (tradeMutezInput && tradeMutezOutput && !tradeMutezInput.isEqualTo(0) && !tradeMutezOutput.isEqualTo(0)) {
      const tradeTzInput = atomsToTokens(tradeMutezInput, inputAssetMetadata.decimals);
      const tradeTzOutput = atomsToTokens(tradeMutezOutput, outputAssetMetadata.decimals);

      return tradeTzInput.dividedBy(tradeTzOutput);
    }

    return undefined;
  }, [trade, inputAssetMetadata.decimals, outputAssetMetadata.decimals]);

  return (
    <span>
      {exchangeRate ? (
        <span className="flex items-end justify-end">
          <span>1 {outputAssetMetadata.symbol}</span>
          <span className="ml-1 mr-1">=</span>
          <Money smallFractionFont={false} fiat={false}>
            {exchangeRate}
          </Money>
          <span className="ml-1">{inputAssetMetadata.symbol}</span>
        </span>
      ) : (
        '-'
      )}
    </span>
  );
};
