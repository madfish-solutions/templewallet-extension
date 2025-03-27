import React, { FC, useCallback } from 'react';

import BigNumber from 'bignumber.js';

import { Button } from 'app/atoms';
import { ConvertedInputAssetAmount } from 'app/atoms/ConvertedInputAssetAmount';
import { FiatCurrencyOptionBase } from 'lib/fiat-currency';
import { ZERO } from 'lib/utils/numbers';

interface SwapFooterProps {
  inputName: string;
  tezosChainId: string;
  assetPrice: BigNumber;
  assetDecimals: number;
  assetSlug: string;
  assetSymbol: string;
  amount: BigNumber | undefined;
  shouldUseFiat: boolean;
  handleFiatToggle: (evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  selectedFiatCurrency: FiatCurrencyOptionBase;
}

const SwapFooter: FC<SwapFooterProps> = ({
  inputName,
  tezosChainId,
  assetPrice,
  assetDecimals,
  assetSlug,
  assetSymbol,
  amount,
  shouldUseFiat,
  handleFiatToggle,
  selectedFiatCurrency
}) => {
  const toAssetAmount = useCallback(
    (fiatAmount: BigNumber.Value = ZERO) =>
      new BigNumber(fiatAmount || '0').dividedBy(assetPrice ?? 1).toFormat(assetDecimals, BigNumber.ROUND_FLOOR, {
        decimalSeparator: '.'
      }),
    [assetPrice, assetDecimals]
  );

  return (
    <div className="flex justify-between mt-1">
      <div className="max-w-40">
        <ConvertedInputAssetAmount
          chainId={tezosChainId}
          assetSlug={assetSlug}
          assetSymbol={assetSymbol}
          amountValue={shouldUseFiat ? toAssetAmount(amount) : amount?.toString() || '0'}
          toFiat={!shouldUseFiat}
          evm={false}
        />
      </div>
      {inputName === 'input' && (
        <Button
          className="text-font-description-bold text-secondary px-1 py-0.5 max-w-40 truncate"
          onClick={handleFiatToggle}
        >
          Switch to {shouldUseFiat ? assetSymbol : selectedFiatCurrency.name}
        </Button>
      )}
    </div>
  );
};

export default SwapFooter;
