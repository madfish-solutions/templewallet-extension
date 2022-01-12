import React, { FC, useMemo } from 'react';

import Money from 'app/atoms/Money';
import { Trade, getTradeInputAmount, getTradeOutputAmount } from 'lib/swap-router';
import { atomsToTokens } from 'lib/temple/helpers';
import { AssetMetadata } from 'lib/temple/metadata';

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
        <span>
          <span>1 {outputAssetMetadata.symbol} = </span>
          <Money smallFractionFont={false} fiat={false}>
            {exchangeRate}
          </Money>
          <span> {inputAssetMetadata.symbol}</span>
        </span>
      ) : (
        '-'
      )}
    </span>
  );
};
