import React, { FC } from 'react';

import BigNumber from 'bignumber.js';
import { noop } from 'lodash';

import { SwapInputValue } from 'app/pages/Swap/form/SwapForm.form';
import SwapInput from 'app/pages/Swap/form/SwapFormInput/SwapInput';
import SwapInputHeader from 'app/pages/Swap/form/SwapFormInput/SwapInputHeader';
import { InputContainer } from 'app/templates/InputContainer/InputContainer';
import { TestIDProps } from 'lib/analytics';
import { FiatCurrencyOptionBase } from 'lib/fiat-currency';
import { OneOfChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

interface SwapFormInputProps extends TestIDProps {
  inputName: 'input' | 'output';
  label: React.ReactNode;
  value: SwapInputValue;
  error?: string;
  onChange: SyncFn<SwapInputValue>;
  readOnly?: boolean;
  className?: string;
  network: OneOfChains;
  assetSymbol: string;
  assetDecimals: number;
  balance?: BigNumber;
  maxAmount?: BigNumber;
  isFiatMode?: boolean;
  selectedFiatCurrency: FiatCurrencyOptionBase;
  handleFiatToggle?: (evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  handleSetMaxAmount?: SyncFn<void>;
  onSelectAssetClick: (field: 'from' | 'to') => void;
  parseFiatValueToAssetAmount: (fiatAmount?: BigNumber.Value, assetDecimals?: number) => BigNumber;
  testIDs?: SwapFormTestIDs;
}

interface SwapFormTestIDs {
  input?: string;
  assetDropDownButton?: string;
}

const SwapFormInput: FC<SwapFormInputProps> = ({
  inputName,
  label,
  value: { assetSlug, amount },
  error,
  onChange,
  readOnly,
  className,
  network,
  assetSymbol,
  assetDecimals,
  balance,
  maxAmount,
  isFiatMode = false,
  selectedFiatCurrency,
  handleFiatToggle,
  handleSetMaxAmount,
  onSelectAssetClick,
  parseFiatValueToAssetAmount,
  testIDs
}) => {
  const isEvmNetwork = network.kind === TempleChainKind.EVM;

  return (
    <div className={className}>
      <InputContainer
        className="px-4 py-5 bg-white rounded-8 shadow-md p-4"
        header={
          <SwapInputHeader
            label={label}
            inputName={inputName}
            isBalanceError={
              isFiatMode
                ? Boolean(amount && maxAmount?.lt(parseFiatValueToAssetAmount(amount, assetDecimals)))
                : Boolean(amount && maxAmount?.lt(amount))
            }
            assetDecimals={assetDecimals}
            handleSetMaxAmount={handleSetMaxAmount ? handleSetMaxAmount : noop}
            assetBalanceStr={assetSlug ? balance?.toString() ?? '0' : undefined}
          />
        }
      >
        <SwapInput
          inputName={inputName}
          amount={amount}
          readOnly={Boolean(readOnly)}
          error={error}
          onChange={onChange}
          chainId={network.chainId}
          evm={isEvmNetwork}
          assetSlug={assetSlug}
          assetSymbol={assetSymbol}
          assetDecimals={assetDecimals}
          onSelectAssetClick={onSelectAssetClick}
          isFiatMode={isFiatMode}
          fiatCurrency={selectedFiatCurrency}
          handleFiatToggle={handleFiatToggle ? handleFiatToggle : noop}
          testId={testIDs?.input}
          parseFiatValueToAssetAmount={parseFiatValueToAssetAmount}
          selectTokenTestId={testIDs?.assetDropDownButton}
        />
      </InputContainer>
    </div>
  );
};

export default SwapFormInput;
