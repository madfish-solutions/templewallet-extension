import React, { FC, MouseEventHandler } from 'react';

import { ChainId } from '@lifi/sdk';
import BigNumber from 'bignumber.js';
import { noop } from 'lodash';

import { SwapFieldName } from 'app/pages/Swap/form/interfaces';
import { SwapInputValue } from 'app/pages/Swap/form/SwapForm.form';
import SwapInput from 'app/pages/Swap/form/SwapFormInput/SwapInput';
import SwapInputHeader from 'app/pages/Swap/form/SwapFormInput/SwapInputHeader';
import { InputContainer } from 'app/templates/InputContainer/InputContainer';
import { TestIDProps } from 'lib/analytics';
import { FiatCurrencyOptionBase } from 'lib/fiat-currency';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';

interface SwapFormInputProps extends TestIDProps {
  inputName: SwapFieldName;
  label: React.ReactNode;
  value: SwapInputValue;
  error?: string;
  onChange: SyncFn<SwapInputValue>;
  readOnly?: boolean;
  className?: string;
  isEvmNetwork: boolean;
  chainId?: string | number;
  assetSymbol: string;
  assetDecimals: number;
  balance?: BigNumber;
  maxAmount?: BigNumber;
  isFiatMode?: boolean;
  selectedFiatCurrency: FiatCurrencyOptionBase;
  handleFiatToggle?: MouseEventHandler<HTMLButtonElement>;
  handleSetMaxAmount?: SyncFn<void>;
  onSelectAssetClick: SyncFn<SwapFieldName>;
  parseFiatValueToAssetAmount: (
    fiatAmount?: BigNumber.Value,
    assetDecimals?: number,
    inputName?: SwapFieldName
  ) => BigNumber;
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
  isEvmNetwork,
  chainId,
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
  return (
    <div className={className}>
      <InputContainer
        className="px-4 py-5 bg-white rounded-8 border-0.5 border-lines p-4"
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
          chainId={chainId ?? (isEvmNetwork ? ChainId.ETH : TEZOS_MAINNET_CHAIN_ID)}
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
