import React, { FC, useCallback } from 'react';

import BigNumber from 'bignumber.js';
import { noop } from 'lodash';
import { Controller, useFormContext } from 'react-hook-form-v7';

import { IconBase } from 'app/atoms';
import { ActionsButtonsBox } from 'app/atoms/PageModal';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as SwapIcon } from 'app/icons/base/swap.svg';
import { SwapFieldName } from 'app/pages/Swap/form/interfaces';
import { dispatch } from 'app/store';
import { resetSwapParamsAction } from 'app/store/swap/actions';
import { setTestID } from 'lib/analytics';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useFiatCurrency } from 'lib/fiat-currency';
import { useAssetUSDPrice } from 'lib/fiat-currency/core';
import { t, T, toLocalFixed } from 'lib/i18n';
import { OneOfChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { SwapFormValue, SwapInputValue } from '../SwapForm.form';
import { SwapFormSelectors, SwapFormFromInputSelectors, SwapFormToInputSelectors } from '../SwapForm.selectors';
import SwapFormInput from '../SwapFormInput';
import { SwapInfoDropdown } from '../SwapInfoDropdown';

interface Props {
  network: OneOfChains;
  inputAssetSlug?: string;
  inputAssetSymbol: string;
  inputAssetDecimals: number;
  inputAssetPrice: BigNumber;
  inputAssetBalance: BigNumber;
  inputAmount?: BigNumber;
  inputTokenAmount?: BigNumber;
  inputTokenMaxAmount: BigNumber;
  outputAssetSlug?: string;
  outputAssetSymbol: string;
  outputAssetDecimals: number;
  outputAssetBalance: BigNumber;
  outputAmount?: BigNumber;
  minimumReceivedAmount?: BigNumber;
  swapParamsAreLoading: boolean;
  swapRouteSteps: number;
  setIsFiatMode?: SyncFn<boolean>;
  parseFiatValueToAssetAmount: (fiatAmount?: BigNumber.Value, assetDecimals?: number) => BigNumber;
  onInputChange: SyncFn<SwapInputValue>;
  onOutputChange: SyncFn<SwapInputValue>;
  onSelectAssetClick: SyncFn<SwapFieldName>;
  handleSetMaxAmount: EmptyFn;
  handleToggleIconClick: EmptyFn;
  onSubmit: EmptyFn;
}

export const BaseSwapForm: FC<Props> = ({
  network,
  inputAssetSlug,
  inputAssetSymbol,
  inputAssetDecimals,
  inputAssetPrice,
  inputAssetBalance,
  inputAmount,
  inputTokenAmount,
  inputTokenMaxAmount,
  outputAssetSlug,
  outputAssetSymbol,
  outputAssetDecimals,
  outputAssetBalance,
  outputAmount,
  minimumReceivedAmount,
  swapParamsAreLoading,
  swapRouteSteps,
  setIsFiatMode = noop,
  parseFiatValueToAssetAmount,
  onInputChange,
  onOutputChange,
  onSelectAssetClick,
  handleSetMaxAmount,
  handleToggleIconClick,
  onSubmit
}) => {
  const { watch, handleSubmit, control, setValue, formState } = useFormContext<SwapFormValue>();
  const { isSubmitting } = formState;

  const isFiatMode = watch('isFiatMode');

  const { selectedFiatCurrency } = useFiatCurrency();

  const isEvmNetwork = network.kind === TempleChainKind.EVM;

  const defaultSlug = isEvmNetwork ? EVM_TOKEN_SLUG : TEZ_TOKEN_SLUG;
  const price = useAssetUSDPrice(outputAssetSlug ?? defaultSlug, network.chainId);
  const outputAmountInUSD = (price && BigNumber(price).times(outputAmount || 0)) || BigNumber(0);

  const validateField = useCallback(({ assetSlug }: SwapInputValue) => {
    if (!assetSlug) return t('assetMustBeSelected');

    return true;
  }, []);

  const validateInputField = useCallback(
    (props: SwapInputValue) => {
      if (props.amount?.isLessThanOrEqualTo(0)) return t('amountMustBePositive');

      const formattedMaxAmount = isFiatMode
        ? inputTokenMaxAmount.times(inputAssetPrice).decimalPlaces(2, BigNumber.ROUND_FLOOR)
        : inputTokenMaxAmount;

      if (props.amount?.gt(formattedMaxAmount)) {
        return t(
          'maximalAmount',
          toLocalFixed(formattedMaxAmount, isFiatMode ? 2 : Math.min(inputAssetDecimals, 6)) +
            ` ${isFiatMode ? selectedFiatCurrency.symbol : inputAssetSymbol}`
        );
      }

      return validateField(props);
    },
    [
      isFiatMode,
      inputTokenMaxAmount,
      inputAssetPrice,
      validateField,
      inputAssetDecimals,
      selectedFiatCurrency.symbol,
      inputAssetSymbol
    ]
  );

  const handleToggleIconClickChangeFields = useCallback(() => {
    handleToggleIconClick();
    setValue('input', {
      assetSlug: outputAssetSlug
    });
    setValue('output', {
      assetSlug: inputAssetSlug
    });
    dispatch(resetSwapParamsAction());
  }, [handleToggleIconClick, inputAssetSlug, outputAssetSlug, setValue]);

  const handleFiatToggle = useCallback(
    (evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      evt.preventDefault();

      const newShouldUseFiat = !isFiatMode;
      setIsFiatMode(newShouldUseFiat);

      if (!inputTokenAmount) return;

      const amountBN = new BigNumber(inputTokenAmount);
      const formattedAmount = newShouldUseFiat
        ? amountBN.times(inputAssetPrice).decimalPlaces(2, BigNumber.ROUND_FLOOR)
        : new BigNumber(amountBN.div(inputAssetPrice)).decimalPlaces(inputAssetDecimals, BigNumber.ROUND_FLOOR);

      onInputChange({ assetSlug: inputAssetSlug, amount: formattedAmount });
    },
    [inputTokenAmount, inputAssetDecimals, inputAssetPrice, inputAssetSlug, isFiatMode, onInputChange, setIsFiatMode]
  );

  return (
    <>
      <form id="swap-form" className="flex-1 pt-4 px-4 flex flex-col overflow-y-auto" onSubmit={handleSubmit(onSubmit)}>
        <Controller
          name="input"
          control={control}
          rules={{ validate: validateInputField }}
          render={({ field: { value }, fieldState: { error } }) => (
            <SwapFormInput
              inputName="input"
              label={<T id="from" />}
              value={value}
              error={error?.message}
              onChange={value => {
                onInputChange(value);
              }}
              network={network}
              assetSymbol={inputAssetSymbol}
              assetDecimals={inputAssetDecimals}
              balance={inputAssetBalance}
              maxAmount={inputTokenMaxAmount}
              isFiatMode={isFiatMode}
              handleFiatToggle={handleFiatToggle}
              selectedFiatCurrency={selectedFiatCurrency}
              handleSetMaxAmount={handleSetMaxAmount}
              onSelectAssetClick={onSelectAssetClick}
              parseFiatValueToAssetAmount={parseFiatValueToAssetAmount}
              testIDs={{
                input: SwapFormFromInputSelectors.assetInput,
                assetDropDownButton: SwapFormFromInputSelectors.assetDropDownButton
              }}
            />
          )}
        />

        <div className="w-full -my-2.5 flex justify-center z-1">
          <StyledButton
            size={'S'}
            style={{ padding: '0.25rem' }}
            color={'secondary-low'}
            onClick={handleToggleIconClickChangeFields}
            type="button"
            {...setTestID(SwapFormSelectors.swapPlacesButton)}
          >
            <IconBase Icon={SwapIcon} className="text-secondary rotate-90" />
          </StyledButton>
        </div>

        <Controller
          name="output"
          control={control}
          render={({ field: { value }, fieldState: { error } }) => (
            <SwapFormInput
              readOnly
              inputName="output"
              label={<T id="toAsset" />}
              value={value}
              error={error?.message}
              onChange={value => {
                onOutputChange(value);
              }}
              className="mb-6"
              network={network}
              balance={outputAssetBalance}
              assetSymbol={outputAssetSymbol}
              assetDecimals={outputAssetDecimals}
              selectedFiatCurrency={selectedFiatCurrency}
              onSelectAssetClick={onSelectAssetClick}
              parseFiatValueToAssetAmount={parseFiatValueToAssetAmount}
              testIDs={{
                input: SwapFormToInputSelectors.assetInput,
                assetDropDownButton: SwapFormToInputSelectors.assetDropDownButton
              }}
            />
          )}
        />

        {outputAmount && (
          <div className="mb-6">
            <SwapInfoDropdown
              showCashBack={!isEvmNetwork ?? outputAmountInUSD.gte(10)}
              swapRouteSteps={swapRouteSteps}
              inputAmount={inputAmount}
              outputAmount={outputAmount}
              inputAssetSymbol={inputAssetSymbol}
              outputAssetSymbol={outputAssetSymbol}
              outputAssetDecimals={outputAssetDecimals}
              minimumReceivedAmount={minimumReceivedAmount}
              evm={isEvmNetwork}
            />
          </div>
        )}
      </form>

      <ActionsButtonsBox className="mt-auto">
        <StyledButton
          type="submit"
          form="swap-form"
          size="L"
          color="primary"
          loading={swapParamsAreLoading || isSubmitting}
          testID={SwapFormSelectors.swapButton}
        >
          <T id="review" />
        </StyledButton>
      </ActionsButtonsBox>
    </>
  );
};
