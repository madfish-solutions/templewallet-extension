import React, { FC, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import BigNumber from 'bignumber.js';

import AssetField from 'app/atoms/AssetField';
import { SwapFieldName } from 'app/pages/Swap/form/interfaces';
import { SwapInputValue } from 'app/pages/Swap/form/SwapForm.form';
import SwapFooter from 'app/pages/Swap/form/SwapFormInput/SwapInputFooter';
import { FiatCurrencyOptionBase } from 'lib/fiat-currency';

import SwapSelectTokenFace from './SwapSelectTokenFace';

interface SwapInputProps {
  inputName: 'input' | 'output';
  amount?: BigNumber;
  readOnly: boolean;
  error?: string;
  onChange: SyncFn<SwapInputValue>;
  chainId: string | number;
  evm: boolean;
  assetSlug?: string;
  assetSymbol: string;
  assetDecimals: number;
  onSelectAssetClick: SyncFn<SwapFieldName>;
  isFiatMode: boolean;
  fiatCurrency: FiatCurrencyOptionBase;
  handleFiatToggle: (evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  testId?: string;
  selectTokenTestId?: string;
  parseFiatValueToAssetAmount: (fiatAmount?: BigNumber.Value, assetDecimals?: number) => BigNumber;
}

const SwapInput: FC<SwapInputProps> = ({
  inputName,
  amount,
  readOnly,
  error,
  onChange,
  chainId,
  evm,
  assetSlug,
  assetSymbol,
  assetDecimals,
  onSelectAssetClick,
  isFiatMode,
  fiatCurrency,
  handleFiatToggle,
  testId,
  selectTokenTestId,
  parseFiatValueToAssetAmount
}) => {
  const handleAmountChange = (newAmount?: string) =>
    onChange({
      assetSlug: assetSlug,
      amount: newAmount && isDefined(newAmount) ? new BigNumber(newAmount) : undefined
    });

  const floatingAssetSymbol = useMemo(
    () => (isFiatMode ? fiatCurrency.name : assetSymbol.slice(0, 4)),
    [assetSymbol, fiatCurrency.name, isFiatMode]
  );

  return (
    <AssetField
      value={amount?.toString()}
      onChange={handleAmountChange}
      extraFloatingInner={isFiatMode && floatingAssetSymbol}
      assetDecimals={isFiatMode ? 2 : assetDecimals}
      placeholder={isFiatMode ? `0.00 ${floatingAssetSymbol}` : '0.00'}
      testID={testId}
      autoFocus
      min={0}
      readOnly={readOnly}
      errorCaption={error}
      shouldShowErrorCaption={false}
      rightSideComponent={
        <SwapSelectTokenFace
          inputName={inputName}
          chainId={chainId}
          assetSlug={assetSlug}
          assetSymbol={assetSymbol}
          onSelectAssetClick={onSelectAssetClick}
          testId={selectTokenTestId}
        />
      }
      underneathComponent={
        <SwapFooter
          inputName={inputName}
          chainId={chainId}
          error={error}
          assetSlug={assetSlug || ''}
          assetSymbol={assetSymbol}
          assetDecimals={assetDecimals}
          amount={amount}
          isFiatMode={isFiatMode}
          handleFiatToggle={handleFiatToggle}
          selectedFiatCurrency={fiatCurrency}
          parseFiatValueToAssetAmount={parseFiatValueToAssetAmount}
          evm={evm}
        />
      }
    />
  );
};

export default SwapInput;
