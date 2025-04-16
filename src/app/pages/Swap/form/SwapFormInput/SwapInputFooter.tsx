import React, { FC, useCallback } from 'react';

import BigNumber from 'bignumber.js';

import { Button } from 'app/atoms';
import { ConvertedInputAssetAmount } from 'app/atoms/ConvertedInputAssetAmount';
import { FiatCurrencyOptionBase } from 'lib/fiat-currency';
import { ZERO } from 'lib/utils/numbers';

interface SwapFooterProps {
  inputName: 'input' | 'output';
  tezosChainId: string;
  error?: string;
  assetPrice: BigNumber;
  assetDecimals: number;
  assetSlug: string;
  assetSymbol: string;
  amount?: BigNumber;
  shouldUseFiat: boolean;
  handleFiatToggle: (evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  selectedFiatCurrency: FiatCurrencyOptionBase;
}

const SwapFooter: FC<SwapFooterProps> = ({
  inputName,
  tezosChainId,
  error,
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
    <div className="flex justify-between items-center mt-1 gap-2">
      <div className="flex-1 flex items-center">
        {error ? (
          <span className="text-font-description text-error whitespace-nowrap overflow-ellipsis">{error}</span>
        ) : (
          <ConvertedInputAssetAmount
            chainId={tezosChainId}
            assetSlug={assetSlug}
            assetSymbol={assetSymbol}
            amountValue={shouldUseFiat ? toAssetAmount(amount) : amount?.toString() || '0'}
            toFiat={!shouldUseFiat}
            evm={false}
          />
        )}
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
