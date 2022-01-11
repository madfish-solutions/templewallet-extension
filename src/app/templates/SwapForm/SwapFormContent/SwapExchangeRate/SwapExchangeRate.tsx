import React, { FC, useMemo } from 'react';

import Money from 'app/atoms/Money';
import { AssetMetadata } from 'lib/temple/metadata';

import { SwapInputValue } from '../SwapFormValue.interface';

interface Props {
  inputValue: SwapInputValue;
  outputValue: SwapInputValue;
  inputAssetMetadata: AssetMetadata;
  outputAssetMetadata: AssetMetadata;
}

export const SwapExchangeRate: FC<Props> = ({ inputValue, outputValue, inputAssetMetadata, outputAssetMetadata }) => {
  const exchangeRate = useMemo(() => {
    if (inputValue.amount && inputValue.assetSlug && outputValue.amount && outputValue.assetSlug) {
      return inputValue.amount.dividedBy(outputValue.amount);
    }

    return undefined;
  }, [inputValue.amount, inputValue.assetSlug, outputValue.amount, outputValue.assetSlug]);

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
