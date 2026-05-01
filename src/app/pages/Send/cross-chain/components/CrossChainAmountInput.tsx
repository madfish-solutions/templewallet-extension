import React, { ReactNode } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';

import { Button } from 'app/atoms';
import AssetField from 'app/atoms/AssetField';
import { ConvertedInputAssetAmount } from 'app/atoms/ConvertedInputAssetAmount';
import Money from 'app/atoms/Money';
import { InputContainer } from 'app/templates/InputContainer/InputContainer';
import { CrossChainAsset } from 'lib/cross-chain';
import { useFiatCurrency } from 'lib/fiat-currency';
import { T } from 'lib/i18n';
import { TempleChainKind } from 'temple/types';

import { useExternalCoinPrice } from '../hooks/use-external-coin-price';

import { AssetSelectButton } from './AssetSelectButton';

interface Props {
  label: ReactNode;
  asset: CrossChainAsset;
  amount: string;
  readOnly?: boolean;
  autoFocus?: boolean;
  balance?: BigNumber;
  isBalanceError?: boolean;
  placeholder?: string;
  errorMessage?: string;
  isFiatMode?: boolean;
  fiatToggleLabel?: string;
  floatingAssetSymbol?: string;
  footer?: ReactNode;
  onAmountChange?: SyncFn<string>;
  onAssetClick: EmptyFn;
  onMaxClick?: EmptyFn;
  onFiatToggle?: (evt: React.MouseEvent<HTMLButtonElement>) => void;
}

export const CrossChainAmountInput = ({
  label,
  asset,
  amount,
  readOnly,
  autoFocus,
  balance,
  isBalanceError,
  placeholder = '0.00',
  errorMessage,
  isFiatMode,
  fiatToggleLabel,
  floatingAssetSymbol,
  footer,
  onAmountChange,
  onAssetClick,
  onMaxClick,
  onFiatToggle
}: Props) => {
  const fiatChainId = asset.chainId;
  const fiatAssetSlug = asset.assetSlug;
  const canShowFiat = fiatChainId != null && fiatAssetSlug != null;
  const canShowConvertedAmount = canShowFiat;
  const amountValue = amount && amount !== '' ? amount : '0';
  const { selectedFiatCurrency } = useFiatCurrency();

  const externalPrice = useExternalCoinPrice(asset.exolixCoin);
  const externalFiat = externalPrice.gt(0) ? new BigNumber(amountValue).times(externalPrice) : null;

  const handleChange = (v?: string) => {
    if (readOnly) return;
    onAmountChange?.(v ?? '');
  };

  return (
    <InputContainer
      className="px-4 py-4 bg-white rounded-8 border-0.5 border-lines"
      header={
        <div className="w-full flex items-center justify-between my-1">
          <span className="text-font-description-bold">{label}</span>
          {balance && (
            <span className="text-xs text-grey-1 flex items-center">
              <span className="mr-1">
                <T id="balanceLabel" />
              </span>
              {onMaxClick ? (
                <Button
                  onClick={onMaxClick}
                  className={clsx(
                    'text-xs text-font-num',
                    isBalanceError ? 'text-error underline' : 'text-secondary'
                  )}
                >
                  <Money tooltip={false} smallFractionFont={false} fiat={false}>
                    {balance}
                  </Money>
                </Button>
              ) : (
                <span className="text-xs text-grey-1 text-font-num">
                  <Money smallFractionFont={false} fiat={false}>
                    {balance}
                  </Money>
                </span>
              )}
            </span>
          )}
        </div>
      }
    >
      <AssetField
        value={amount}
        onChange={handleChange}
        extraFloatingInner={isFiatMode && floatingAssetSymbol ? floatingAssetSymbol : undefined}
        assetDecimals={isFiatMode ? 2 : asset.decimals}
        placeholder={placeholder}
        autoFocus={autoFocus}
        readOnly={readOnly}
        min={0}
        errorCaption={errorMessage}
        shouldShowErrorCaption={false}
        rightSideComponent={<AssetSelectButton asset={asset} onClick={onAssetClick} />}
        underneathComponent={
          <div className="flex justify-between items-center gap-2 min-h-6">
            <div className="flex-1 flex items-center">
              {errorMessage ? (
                <span className="text-font-description text-error whitespace-nowrap text-ellipsis">
                  {errorMessage}
                </span>
              ) : canShowConvertedAmount ? (
                <ConvertedInputAssetAmount
                  chainId={fiatChainId}
                  assetSlug={fiatAssetSlug}
                  assetSymbol={asset.symbol}
                  amountValue={amountValue}
                  toFiat={!isFiatMode}
                  evm={asset.chainKind === TempleChainKind.EVM}
                />
              ) : externalFiat ? (
                <span className="text-font-num-12 text-grey-1 flex items-baseline gap-x-1">
                  <span>≈</span>
                  <Money fiat tooltip={false} smallFractionFont={false}>
                    {externalFiat}
                  </Money>
                  <span>{selectedFiatCurrency.symbol}</span>
                </span>
              ) : (
                <span className="text-font-num-12 text-grey-1">≈ 0.00 {selectedFiatCurrency.symbol}</span>
              )}
            </div>
            {onFiatToggle && fiatToggleLabel && canShowFiat && (
              <Button
                type="button"
                className="text-font-description-bold text-secondary px-1 py-0.5 my-0.5 max-w-40 truncate"
                onClick={onFiatToggle}
              >
                {fiatToggleLabel}
              </Button>
            )}
          </div>
        }
      />

      {footer}
    </InputContainer>
  );
};
