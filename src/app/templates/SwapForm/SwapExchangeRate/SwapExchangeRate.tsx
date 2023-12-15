import React, { FC, useMemo } from 'react';

import { BigNumber } from 'bignumber.js';

import Money from 'app/atoms/Money';
import { AssetMetadataBase } from 'lib/metadata';
import { ZERO } from 'lib/utils/numbers';

interface Props {
  inputAmount: BigNumber | undefined;
  outputAmount: BigNumber | undefined;
  inputAssetMetadata: AssetMetadataBase;
  outputAssetMetadata: AssetMetadataBase;
}

export const SwapExchangeRate: FC<Props> = ({ inputAmount, outputAmount, inputAssetMetadata, outputAssetMetadata }) => {
  const exchangeRate = useMemo(() => {
    if (inputAmount && outputAmount && outputAmount.isGreaterThan(ZERO)) {
      return inputAmount.dividedBy(outputAmount);
    }

    return undefined;
  }, [inputAmount, outputAmount, inputAssetMetadata.decimals, outputAssetMetadata.decimals]);

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
