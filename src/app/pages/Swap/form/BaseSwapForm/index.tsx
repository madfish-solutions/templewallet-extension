import React, { FC, useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { isEmpty, noop } from 'lodash';
import { Controller, SubmitErrorHandler, useFormContext } from 'react-hook-form-v7';

import { IconBase } from 'app/atoms';
import { ActionsButtonsBox } from 'app/atoms/PageModal';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as SwapIcon } from 'app/icons/base/swap.svg';
import { BridgeDetails, SwapFieldName } from 'app/pages/Swap/form/interfaces';
import { EvmSwapInfoDropdown } from 'app/pages/Swap/form/SwapInfoDropdown/EvmSwapInfoDropdown';
import { TezosSwapInfoDropdown } from 'app/pages/Swap/form/SwapInfoDropdown/TezosSwapInfoDropdown';
import { dispatch } from 'app/store';
import { useUserTestingGroupNameSelector } from 'app/store/ab-testing/selectors';
import { setOnRampAssetAction } from 'app/store/settings/actions';
import { resetSwapParamsAction } from 'app/store/swap/actions';
import { setTestID } from 'lib/analytics';
import { ABTestGroup } from 'lib/apis/temple/endpoints/get-ab-group';
import { isWertSupportedChainAssetSlug } from 'lib/apis/wert';
import { toChainAssetSlug } from 'lib/assets/utils';
import { useFiatCurrency } from 'lib/fiat-currency';
import { t, T, toLocalFixed } from 'lib/i18n';
import { SWAP_CASHBACK_RATIO, SWAP_THRESHOLD_TO_GET_CASHBACK } from 'lib/route3/constants';
import { TempleChainKind } from 'temple/types';

import { SwapFormValue, SwapInputValue } from '../SwapForm.form';
import { SwapFormFromInputSelectors, SwapFormSelectors, SwapFormToInputSelectors } from '../SwapForm.selectors';
import SwapFormInput from '../SwapFormInput';

interface Props {
  isEvmNetwork: boolean;
  inputAssetSlug?: string;
  inputAssetSymbol: string;
  inputAssetDecimals: number;
  inputAssetPrice: BigNumber;
  inputAssetBalance: BigNumber;
  inputAmount?: BigNumber;
  inputTokenAmount?: BigNumber;
  inputChainId?: string | number;
  inputTokenMaxAmount: BigNumber;
  outputAssetSlug?: string;
  outputAssetSymbol: string;
  outputAssetDecimals: number;
  outputAssetPrice: BigNumber;
  outputAssetBalance: BigNumber;
  outputTokenAmount?: BigNumber;
  outputAmount?: BigNumber;
  outputChainId?: string | number;
  minimumReceivedAmount?: BigNumber;
  swapParamsAreLoading: boolean;
  swapRouteSteps: number;
  templeAssetPrice?: BigNumber;
  bridgeDetails?: BridgeDetails;
  setIsFiatMode?: SyncFn<boolean>;
  parseFiatValueToAssetAmount: (
    fiatAmount?: BigNumber.Value,
    assetDecimals?: number,
    inputName?: SwapFieldName
  ) => BigNumber;
  onInputChange: SyncFn<SwapInputValue>;
  onOutputChange: SyncFn<SwapInputValue>;
  onSelectAssetClick: SyncFn<SwapFieldName>;
  handleSetMaxAmount: EmptyFn;
  handleToggleIconClick: EmptyFn;
  onSubmit: EmptyFn;
}

export const BaseSwapForm: FC<Props> = ({
  isEvmNetwork,
  inputAssetSlug,
  inputAssetSymbol,
  inputAssetDecimals,
  inputAssetPrice,
  inputAssetBalance,
  inputAmount,
  inputTokenAmount,
  inputChainId,
  inputTokenMaxAmount,
  outputAssetSlug,
  outputAssetSymbol,
  outputAssetDecimals,
  outputAssetPrice,
  outputAssetBalance,
  outputTokenAmount,
  outputAmount,
  outputChainId,
  minimumReceivedAmount,
  swapParamsAreLoading,
  swapRouteSteps,
  templeAssetPrice,
  bridgeDetails,
  setIsFiatMode = noop,
  parseFiatValueToAssetAmount,
  onInputChange,
  onOutputChange,
  onSelectAssetClick,
  handleSetMaxAmount,
  handleToggleIconClick,
  onSubmit
}) => {
  const { watch, handleSubmit, control, setValue, getValues, formState } = useFormContext<SwapFormValue>();
  const { isSubmitting, submitCount, errors } = formState;

  const formSubmitted = submitCount > 0;

  const isFiatMode = watch('isFiatMode');

  const { selectedFiatCurrency } = useFiatCurrency();
  const testGroupName = useUserTestingGroupNameSelector();

  const inputAmountInUSD = (inputAssetPrice && BigNumber(inputAssetPrice).times(inputAmount || 0)) || BigNumber(0);

  const cashbackProgress = useMemo(() => {
    const threshold = new BigNumber(SWAP_THRESHOLD_TO_GET_CASHBACK);
    const usd = inputAmountInUSD;

    const show = !isEvmNetwork && testGroupName === ABTestGroup.B;
    if (!show) return { show: false } as const;

    const isZero = usd.lte(0);
    const reached = usd.gte(threshold);
    const remaining = BigNumber.maximum(threshold.minus(usd), 0);
    const percent = reached ? 100 : usd.div(threshold).times(100).toNumber();

    let tkeyText: string | null = null;
    if (reached && templeAssetPrice && templeAssetPrice.gt(0)) {
      const estimatedTkey = usd.times(SWAP_CASHBACK_RATIO).div(templeAssetPrice);
      const display = estimatedTkey.lt(0.01) ? '< 0.01' : toLocalFixed(estimatedTkey, 2);
      tkeyText = `${display} TKEY ✓`;
    }

    return {
      show,
      isZero,
      reached,
      remaining,
      percent: Math.max(0, Math.min(100, percent)),
      tkeyText
    } as const;
  }, [inputAmountInUSD, isEvmNetwork, templeAssetPrice, testGroupName]);

  const validateInputField = useCallback(
    (props: SwapInputValue) => {
      if (props.amount?.isLessThanOrEqualTo(0) || !props.amount) return t('amountMustBePositive');

      const { isFiatMode } = getValues();
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

      if (!props.assetSlug) return t('assetMustBeSelected');
      return true;
    },
    [getValues, inputTokenMaxAmount, inputAssetPrice, inputAssetDecimals, selectedFiatCurrency.symbol, inputAssetSymbol]
  );

  const validateOutputField = useCallback((props: SwapInputValue) => {
    if (!props.assetSlug) return t('assetMustBeSelected');
    return true;
  }, []);

  const handleToggleIconClickChangeFields = useCallback(() => {
    handleToggleIconClick();
    setValue('input', {
      assetSlug: outputAssetSlug,
      chainId: outputChainId,
      amount: undefined
    });
    setValue('output', {
      assetSlug: inputAssetSlug,
      chainId: inputChainId,
      amount: undefined
    });
    dispatch(resetSwapParamsAction());
  }, [handleToggleIconClick, inputAssetSlug, inputChainId, outputAssetSlug, outputChainId, setValue]);

  const handleFiatToggle = useCallback(
    (evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      evt.preventDefault();

      const newShouldUseFiat = !isFiatMode;
      setIsFiatMode(newShouldUseFiat);

      if (inputTokenAmount) {
        const amountBN = new BigNumber(inputTokenAmount);
        const formattedAmount = newShouldUseFiat
          ? amountBN.times(inputAssetPrice).decimalPlaces(2, BigNumber.ROUND_FLOOR)
          : amountBN.div(inputAssetPrice).decimalPlaces(inputAssetDecimals, BigNumber.ROUND_FLOOR);

        onInputChange({ assetSlug: inputAssetSlug, chainId: inputChainId, amount: formattedAmount });
      }

      if (outputTokenAmount) {
        const amountBN = new BigNumber(outputTokenAmount);
        const formattedAmount = newShouldUseFiat
          ? amountBN.times(outputAssetPrice).decimalPlaces(2, BigNumber.ROUND_FLOOR)
          : amountBN.div(outputAssetPrice).decimalPlaces(outputAssetDecimals, BigNumber.ROUND_FLOOR);

        onOutputChange({ assetSlug: outputAssetSlug, chainId: outputChainId, amount: formattedAmount });
      }
    },
    [
      isFiatMode,
      setIsFiatMode,
      inputTokenAmount,
      outputTokenAmount,
      inputAssetPrice,
      inputAssetDecimals,
      onInputChange,
      inputAssetSlug,
      inputChainId,
      outputAssetPrice,
      outputAssetDecimals,
      onOutputChange,
      outputAssetSlug,
      outputChainId
    ]
  );

  const onInvalidSubmit = useCallback<SubmitErrorHandler<SwapFormValue>>(
    errors => {
      if (errors.input?.message?.includes(t('maximalAmount')) && inputAssetSlug) {
        const chainAssetSlug = toChainAssetSlug(
          isEvmNetwork ? TempleChainKind.EVM : TempleChainKind.Tezos,
          inputChainId!,
          inputAssetSlug
        );

        isWertSupportedChainAssetSlug(chainAssetSlug) && dispatch(setOnRampAssetAction(chainAssetSlug));
      }
    },
    [inputAssetSlug, inputChainId, isEvmNetwork]
  );

  return (
    <>
      <form
        id="swap-form"
        className="flex-1 pt-4 px-4 flex flex-col overflow-y-auto"
        onSubmit={handleSubmit(onSubmit, onInvalidSubmit)}
      >
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
              onChange={partialUpdate => {
                onInputChange({
                  ...value,
                  ...partialUpdate
                });
              }}
              isEvmNetwork={isEvmNetwork}
              chainId={inputChainId}
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
            size="S"
            style={{ padding: '0.25rem' }}
            color="secondary-low"
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
          rules={{ validate: validateOutputField }}
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
              isEvmNetwork={isEvmNetwork}
              chainId={outputChainId}
              assetSymbol={outputAssetSymbol}
              assetDecimals={outputAssetDecimals}
              balance={outputAssetBalance}
              isFiatMode={isFiatMode}
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
            {isEvmNetwork ? (
              !swapParamsAreLoading && (
                <EvmSwapInfoDropdown
                  swapRouteSteps={swapRouteSteps}
                  inputAmount={inputAmount}
                  outputAmount={outputAmount}
                  inputAssetSymbol={inputAssetSymbol}
                  outputAssetSymbol={outputAssetSymbol}
                  outputAssetDecimals={outputAssetDecimals}
                  minimumReceivedAmount={minimumReceivedAmount}
                  bridgeDetails={bridgeDetails}
                />
              )
            ) : (
              <TezosSwapInfoDropdown
                showCashBack={inputAmountInUSD.gte(SWAP_THRESHOLD_TO_GET_CASHBACK)}
                swapRouteSteps={swapRouteSteps}
                inputAmount={inputAmount}
                outputAmount={outputAmount}
                inputAssetSymbol={inputAssetSymbol}
                outputAssetSymbol={outputAssetSymbol}
                outputAssetDecimals={outputAssetDecimals}
                minimumReceivedAmount={minimumReceivedAmount}
              />
            )}
          </div>
        )}
      </form>
      {cashbackProgress.show && (
        <div className="px-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <div className="flex items-center gap-2">
              <span>🎁</span>
              <span className="font-semibold">Cashback</span>
            </div>
            <div className="text-grey-1">
              {cashbackProgress.isZero && 'Swap over 10$ and get 0.3% back'}
              {!cashbackProgress.isZero &&
                !cashbackProgress.reached &&
                `Only ${toLocalFixed(cashbackProgress.remaining, 2)}$ to go`}
              {cashbackProgress.reached && cashbackProgress.tkeyText}
            </div>
          </div>
          {!cashbackProgress.isZero && (
            <div className="w-full h-1 rounded bg-[#E9E9EB]">
              <div className="h-1 rounded bg-[#FF5B00]" style={{ width: `${cashbackProgress.percent}%` }} />
            </div>
          )}
        </div>
      )}
      <ActionsButtonsBox className="mt-auto">
        <StyledButton
          type="submit"
          form="swap-form"
          size="L"
          color="primary"
          loading={swapParamsAreLoading || isSubmitting}
          disabled={formSubmitted && !isEmpty(errors)}
          testID={SwapFormSelectors.swapButton}
        >
          <T id="review" />
        </StyledButton>
      </ActionsButtonsBox>
    </>
  );
};
