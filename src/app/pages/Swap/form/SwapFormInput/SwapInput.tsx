import React, { FC, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import AssetField from 'app/atoms/AssetField';
import SwapFooter from 'app/pages/Swap/form/SwapFormInput/SwapInputFooter';
import { FiatCurrencyOptionBase } from 'lib/fiat-currency';
import { AssetMetadataBase } from 'lib/metadata';

import SwapSelectTokenFace from './SwapSelectTokenFace';

interface SwapInputProps {
  inputName: 'input' | 'output';
  tezosChainId: string;
  amount?: BigNumber;
  amountInputDisabled: boolean;
  error?: string;
  assetPrice: BigNumber;
  assetSlug: string | undefined;
  assetMetadata: AssetMetadataBase;
  selectTokenTestId?: string;
  shouldUseFiat: boolean;
  fiatCurrency: FiatCurrencyOptionBase;
  handleFiatToggle: (evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  onChange: (value?: BigNumber, shouldUseFiat?: boolean) => void;
  onSelectAsset: EmptyFn;
  testId?: string;
}

const SwapInput: FC<SwapInputProps> = ({
  inputName,
  tezosChainId,
  amount,
  amountInputDisabled,
  error,
  assetPrice,
  assetSlug,
  assetMetadata,
  shouldUseFiat,
  fiatCurrency,
  onChange,
  handleFiatToggle,
  onSelectAsset,
  selectTokenTestId,
  testId
}) => {
  const handleAmountChange = (newAmount?: string) =>
    onChange(Boolean(newAmount) && isDefined(newAmount) ? new BigNumber(newAmount) : undefined, shouldUseFiat);

  const floatingAssetSymbol = useMemo(
    () => (shouldUseFiat ? fiatCurrency.name : assetMetadata.symbol.slice(0, 4)),
    [assetMetadata.symbol, fiatCurrency.name, shouldUseFiat]
  );

  return (
    <div className={classNames('flex-1 flex items-center justify-between rounded-r-md min-h-18')}>
      <div className="h-full flex-1 flex items-end justify-center flex-col">
        <AssetField
          value={amount?.toString()}
          onChange={handleAmountChange}
          extraFloatingInner={shouldUseFiat && floatingAssetSymbol}
          assetDecimals={shouldUseFiat ? 2 : assetMetadata.decimals}
          placeholder={`0.00 ${floatingAssetSymbol}`}
          testID={testId}
          autoFocus
          min={0}
          disabled={amountInputDisabled}
          rightSideComponent={
            <SwapSelectTokenFace
              tezosChainId={tezosChainId}
              assetSlug={assetSlug}
              assetSymbol={assetMetadata.symbol}
              onSelectAssetClick={onSelectAsset}
              testId={selectTokenTestId}
            />
          }
          underneathComponent={
            <SwapFooter
              inputName={inputName}
              tezosChainId={tezosChainId}
              error={error}
              assetPrice={assetPrice}
              assetDecimals={assetMetadata.decimals}
              assetSlug={assetSlug || ''}
              assetSymbol={assetMetadata.symbol}
              amount={amount}
              shouldUseFiat={shouldUseFiat}
              handleFiatToggle={handleFiatToggle}
              selectedFiatCurrency={fiatCurrency}
            />
          }
        />
      </div>
    </div>
  );
};

export default SwapInput;
