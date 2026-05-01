import React from 'react';

import BigNumber from 'bignumber.js';

import { CrossChainAsset } from 'lib/cross-chain';
import { T, t } from 'lib/i18n';

import { CrossChainAmountInput } from './CrossChainAmountInput';

interface Props {
  asset: CrossChainAsset;
  amount: string;
  balance: BigNumber;
  insufficient: boolean;
  min?: number;
  max?: number;
  errorMessage?: string;
  isFiatMode?: boolean;
  fiatToggleLabel?: string;
  floatingAssetSymbol?: string;
  onAmountChange: SyncFn<string>;
  onAssetClick: EmptyFn;
  onMaxClick?: EmptyFn;
  onFiatToggle?: (evt: React.MouseEvent<HTMLButtonElement>) => void;
}

export const SendCard: React.FC<Props> = ({
  asset,
  amount,
  balance,
  insufficient,
  min,
  errorMessage,
  isFiatMode,
  fiatToggleLabel,
  floatingAssetSymbol,
  onAmountChange,
  onAssetClick,
  onMaxClick,
  onFiatToggle
}) => {
  const placeholder = (() => {
    if (isFiatMode && floatingAssetSymbol) return `0.00 ${floatingAssetSymbol}`;
    if (typeof min === 'number' && !amount) return t('minWithValue', String(min));
    return '0.00';
  })();

  return (
    <CrossChainAmountInput
      label={<T id="send" />}
      asset={asset}
      amount={amount}
      autoFocus
      balance={balance}
      isBalanceError={insufficient || Boolean(errorMessage)}
      placeholder={placeholder}
      errorMessage={errorMessage}
      isFiatMode={isFiatMode}
      fiatToggleLabel={fiatToggleLabel}
      floatingAssetSymbol={floatingAssetSymbol}
      onAmountChange={onAmountChange}
      onAssetClick={onAssetClick}
      onMaxClick={onMaxClick}
      onFiatToggle={onFiatToggle}
    />
  );
};
