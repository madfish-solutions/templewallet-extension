import React, { FC, useMemo } from 'react';

import { BigNumber } from 'bignumber.js';

import { Trade } from 'lib/swap-router/interface/trade.interface';
import { tokensToAtoms } from 'lib/temple/helpers';
import { AssetMetadata } from 'lib/temple/metadata';

import { SwapInputValue } from '../SwapFormValue.interface';

interface Props {
  trade: Trade;
  inputValue: SwapInputValue;
  outputValue: SwapInputValue;
  inputAssetMetadata: AssetMetadata;
  outputAssetMetadata: AssetMetadata;
}

export const SwapPriceImpact: FC<Props> = ({
  trade,
  inputValue,
  outputValue,
  inputAssetMetadata,
  outputAssetMetadata
}) => {
  const priceImpact = useMemo(() => {
    if (inputValue.amount && outputValue.amount && trade.length > 0) {
      const inputMutezAmount = tokensToAtoms(inputValue.amount, inputAssetMetadata.decimals);
      const outputMutezAmount = tokensToAtoms(outputValue.amount, outputAssetMetadata.decimals);

      const linearOutputMutezAmount = trade.reduce((previousTradeOutput, tradeOperation) => {
        const linearExchangeRate = tradeOperation.bTokenPool.dividedBy(tradeOperation.aTokenPool);

        return previousTradeOutput.multipliedBy(linearExchangeRate);
      }, inputMutezAmount);

      const HUNDRED = new BigNumber(100);

      return HUNDRED.minus(HUNDRED.dividedBy(linearOutputMutezAmount).multipliedBy(outputMutezAmount));
    }

    return undefined;
  }, [trade, inputValue.amount, outputValue.amount, inputAssetMetadata.decimals, outputAssetMetadata.decimals]);

  return <span>{priceImpact ? `${priceImpact.toFixed(2)}%` : '-'}</span>;
};
