import React, { FC } from 'react';

import { isDefined } from '@rnw-community/shared';
import BigNumber from 'bignumber.js';

import { Button } from 'app/atoms';
import { ConvertedInputAssetAmount } from 'app/atoms/ConvertedInputAssetAmount';
import { SwapFieldName } from 'app/pages/Swap/form/interfaces';
import { FiatCurrencyOptionBase } from 'lib/fiat-currency';

interface SwapFooterProps {
  inputName: SwapFieldName;
  amount?: BigNumber;
  error?: string;
  chainId: string | number;
  evm: boolean;
  assetSlug?: string;
  assetSymbol: string;
  assetDecimals: number;
  isFiatMode: boolean;
  selectedFiatCurrency: FiatCurrencyOptionBase;
  handleFiatToggle: (evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  parseFiatValueToAssetAmount: (
    fiatAmount?: BigNumber.Value,
    assetDecimals?: number,
    inputName?: SwapFieldName
  ) => BigNumber;
}

const SwapFooter: FC<SwapFooterProps> = ({
  inputName,
  amount,
  error,
  chainId,
  evm,
  assetSlug,
  assetSymbol,
  assetDecimals,
  isFiatMode,
  selectedFiatCurrency,
  handleFiatToggle,
  parseFiatValueToAssetAmount
}) => {
  const shouldShowConvertedAmount = (isFiatMode && isDefined(assetSlug)) || !isFiatMode;

  return (
    <div className="flex justify-between items-center gap-2 min-h-6">
      <div className="flex-1 flex items-center">
        {error ? (
          <span className="text-font-description text-error whitespace-nowrap overflow-ellipsis">{error}</span>
        ) : shouldShowConvertedAmount ? (
          <ConvertedInputAssetAmount
            chainId={chainId}
            assetSlug={assetSlug || ''}
            assetSymbol={assetSymbol}
            amountValue={
              isFiatMode
                ? parseFiatValueToAssetAmount(amount, assetDecimals, inputName).toString()
                : amount?.toString() || '0'
            }
            toFiat={!isFiatMode}
            evm={evm}
          />
        ) : null}
      </div>
      {inputName === 'input' && (
        <Button
          className="text-font-description-bold text-secondary px-1 py-0.5 my-0.5 max-w-40 truncate"
          onClick={handleFiatToggle}
        >
          Switch to {isFiatMode ? assetSymbol : selectedFiatCurrency.name}
        </Button>
      )}
    </div>
  );
};

export default SwapFooter;
