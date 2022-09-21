import React, { FC, useEffect, useMemo, useRef, useState } from 'react';

import { BatchWalletOperation } from '@taquito/taquito/dist/types/wallet/batch-operation';
import BigNumber from 'bignumber.js';
import classNames from 'clsx';
import { Controller, useForm } from 'react-hook-form';
import {
  DexTypeEnum,
  getBestTradeExactInput,
  getTradeOpParams,
  getTradeOutputAmount,
  parseTransferParamsToParamsWithKind,
  Trade,
  useAllRoutePairs,
  useRoutePairsCombinations,
  useTradeWithSlippageTolerance
} from 'swap-router-sdk';

import Alert from 'app/atoms/Alert';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import { ReactComponent as InfoIcon } from 'app/icons/info.svg';
import { ReactComponent as ToggleIcon } from 'app/icons/toggle.svg';
import OperationStatus from 'app/templates/OperationStatus';
import { useFormAnalytics } from 'lib/analytics';
import { T, t } from 'lib/i18n/react';
import { getRoutingFeeTransferParams } from 'lib/swap-router';
import { ROUTING_FEE_PERCENT, ROUTING_FEE_RATIO, TEZOS_DEXES_API_URL } from 'lib/swap-router/config';
import { useAccount, useAssetMetadata, useTezos } from 'lib/temple/front';
import { atomsToTokens, tokensToAtoms } from 'lib/temple/helpers';
import useTippy from 'lib/ui/useTippy';
import { HistoryAction, navigate } from 'lib/woozie';

import { SwapExchangeRate } from './SwapExchangeRate/SwapExchangeRate';
import { SwapFormValue, SwapInputValue, useSwapFormDefaultValue } from './SwapForm.form';
import styles from './SwapForm.module.css';
import { SwapFormSelectors } from './SwapForm.selectors';
import { feeInfoTippyProps } from './SwapForm.tippy';
import { SlippageToleranceInput } from './SwapFormInput/SlippageToleranceInput/SlippageToleranceInput';
import { slippageToleranceInputValidationFn } from './SwapFormInput/SlippageToleranceInput/SlippageToleranceInput.validation';
import { SwapFormInput } from './SwapFormInput/SwapFormInput';
import { SwapMinimumReceived } from './SwapMinimumReceived/SwapMinimumReceived';
import { SwapPriceUpdateBar } from './SwapPriceUpdateBar/SwapPriceUpdateBar';
import { SwapRoute } from './SwapRoute/SwapRoute';

const KNOWN_DEX_TYPES = [
  DexTypeEnum.QuipuSwap,
  DexTypeEnum.QuipuSwapTokenToTokenDex,
  DexTypeEnum.QuipuSwapCurveLike,
  DexTypeEnum.Plenty,
  DexTypeEnum.PlentyBridge,
  DexTypeEnum.PlentyStableSwap,
  DexTypeEnum.PlentyVolatileSwap,
  DexTypeEnum.PlentyCtez,
  DexTypeEnum.LiquidityBaking,
  DexTypeEnum.Youves,
  DexTypeEnum.Vortex,
  DexTypeEnum.Spicy,
  DexTypeEnum.SpicyWrap
];

export const SwapForm: FC = () => {
  const tezos = useTezos();
  const account = useAccount();
  const formAnalytics = useFormAnalytics('SwapForm');

  const feeInfoIconRef = useTippy<HTMLSpanElement>(feeInfoTippyProps);

  const defaultValues = useSwapFormDefaultValue();
  const { handleSubmit, errors, watch, setValue, control, register, triggerValidation } = useForm<SwapFormValue>({
    defaultValues
  });
  const isValid = Object.keys(errors).length === 0;

  const inputValue = watch('input');
  const outputValue = watch('output');
  const slippageTolerance = watch('slippageTolerance');

  const inputAssetMetadata = useAssetMetadata(inputValue.assetSlug ?? 'tez');
  const outputAssetMetadata = useAssetMetadata(outputValue.assetSlug ?? 'tez');

  const [bestTrade, setBestTrade] = useState<Trade>([]);
  const allRoutePairs = useAllRoutePairs(TEZOS_DEXES_API_URL);
  const filteredRoutePairs = useMemo(
    () => allRoutePairs.data.filter(routePair => KNOWN_DEX_TYPES.includes(routePair.dexType)),
    [allRoutePairs.data]
  );
  const routePairsCombinations = useRoutePairsCombinations(
    inputValue.assetSlug,
    outputValue.assetSlug,
    filteredRoutePairs
  );

  const inputMutezAmount = useMemo(
    () => (inputValue.amount ? tokensToAtoms(inputValue.amount, inputAssetMetadata.decimals) : undefined),
    [inputValue.amount, inputAssetMetadata.decimals]
  );
  const bestTradeWithSlippageTolerance = useTradeWithSlippageTolerance(inputMutezAmount, bestTrade, slippageTolerance);

  const [error, setError] = useState<Error>();
  const [operation, setOperation] = useState<BatchWalletOperation>();
  const isSubmitButtonPressedRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(
    () =>
      navigate(
        { pathname: '/swap', search: `from=${inputValue.assetSlug ?? ''}&to=${outputValue.assetSlug ?? ''}` },
        HistoryAction.Replace
      ),
    [inputValue.assetSlug, outputValue.assetSlug]
  );

  const minimumReceivedAmount = useMemo(() => {
    if (bestTradeWithSlippageTolerance.length > 0) {
      const lastTradeOperationOutput = getTradeOutputAmount(bestTradeWithSlippageTolerance) ?? new BigNumber(0);

      const amount = atomsToTokens(lastTradeOperationOutput, outputAssetMetadata.decimals);

      return amount;
    }
    return new BigNumber(0);
  }, [bestTradeWithSlippageTolerance, outputAssetMetadata.decimals]);

  useEffect(() => {
    if (bestTrade.length) {
      const bestTradeOutput = getTradeOutputAmount(bestTrade);

      const outputTzAmount = bestTradeOutput
        ? atomsToTokens(bestTradeOutput, outputAssetMetadata.decimals)
        : new BigNumber(0);

      const feeAmount = minimumReceivedAmount.minus(
        minimumReceivedAmount.multipliedBy(ROUTING_FEE_RATIO).dividedToIntegerBy(1)
      );
      const finalAmount = outputTzAmount.minus(feeAmount);

      setValue('output', { assetSlug: outputValue.assetSlug, amount: finalAmount });
    }
  }, [bestTrade, minimumReceivedAmount, outputAssetMetadata.decimals, outputValue.assetSlug, setValue]);

  useEffect(() => {
    if (inputMutezAmount && routePairsCombinations.length > 0) {
      const bestTradeExactIn = getBestTradeExactInput(inputMutezAmount, routePairsCombinations);
      setBestTrade(bestTradeExactIn);
    } else {
      setBestTrade([]);
      setValue('output', { assetSlug: outputValue.assetSlug, amount: undefined });
    }

    if (isSubmitButtonPressedRef.current) {
      triggerValidation();
    }
  }, [
    inputMutezAmount,
    outputValue.assetSlug,
    slippageTolerance,
    routePairsCombinations,
    outputAssetMetadata.decimals,
    setValue,
    triggerValidation
  ]);

  useEffect(() => {
    register('input', {
      validate: ({ assetSlug, amount }: SwapInputValue) => {
        if (!assetSlug) {
          return t('assetMustBeSelected');
        }
        if (!amount || amount.isLessThanOrEqualTo(0)) {
          return t('amountMustBePositive');
        }

        return true;
      }
    });
    register('output', {
      validate: ({ assetSlug, amount }: SwapInputValue) => {
        if (!assetSlug) {
          return t('assetMustBeSelected');
        }
        if (!amount || amount.isLessThanOrEqualTo(0)) {
          return t('amountMustBePositive');
        }

        return true;
      }
    });
  }, [register]);

  const onSubmit = async () => {
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);

    const analyticsProperties = {
      inputAsset: inputValue.assetSlug,
      outputAsset: outputValue.assetSlug
    };

    formAnalytics.trackSubmit(analyticsProperties);

    try {
      setOperation(undefined);
      const routingFeeOpParams = await getRoutingFeeTransferParams(
        getTradeOutputAmount(bestTradeWithSlippageTolerance),
        bestTradeWithSlippageTolerance,
        account.publicKeyHash,
        tezos
      );
      const tradeOpParams = await getTradeOpParams(bestTradeWithSlippageTolerance, account.publicKeyHash, tezos);

      const opParams = [...tradeOpParams, ...routingFeeOpParams].map(transferParams =>
        parseTransferParamsToParamsWithKind(transferParams)
      );

      const batchOperation = await tezos.wallet.batch(opParams).send();

      setError(undefined);
      formAnalytics.trackSubmitSuccess(analyticsProperties);
      setOperation(batchOperation);
    } catch (err: any) {
      if (err.message !== 'Declined') {
        setError(err);
      }
      formAnalytics.trackSubmitFail(analyticsProperties);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleErrorClose = () => setError(undefined);
  const handleOperationClose = () => setOperation(undefined);

  const handleToggleIconClick = () =>
    setValue([
      { input: { assetSlug: outputValue.assetSlug, amount: inputValue.amount } },
      { output: { assetSlug: inputValue.assetSlug } }
    ]);

  const handleInputChange = (newInputValue: SwapInputValue) => {
    setValue('input', newInputValue);

    if (newInputValue.assetSlug === outputValue.assetSlug) {
      setValue('output', {});
    }
  };
  const handleOutputChange = (newOutputValue: SwapInputValue) => {
    setValue('output', newOutputValue);

    if (newOutputValue.assetSlug === inputValue.assetSlug) {
      setValue('input', {});
    }
  };

  const handleSubmitButtonClick = () => (isSubmitButtonPressedRef.current = true);

  return (
    <form className="mb-8" onSubmit={handleSubmit(onSubmit)}>
      {operation && (
        <OperationStatus
          className="mb-6"
          closable
          typeTitle={t('swapNoun')}
          operation={operation}
          onClose={handleOperationClose}
        />
      )}

      <SwapFormInput
        name="input"
        value={inputValue}
        // @ts-ignore
        error={errors.input?.message}
        label={<T id="from" />}
        onChange={handleInputChange}
      />

      <div className="w-full my-4 flex justify-center">
        <button onClick={handleToggleIconClick} type="button">
          <ToggleIcon className="w-6 h-auto stroke-2 stroke-current text-blue-500" />
        </button>
      </div>

      <SwapFormInput
        className="mb-6"
        name="output"
        value={outputValue}
        // @ts-ignore
        error={errors.output?.message}
        label={<T id="toAsset" />}
        amountInputDisabled={true}
        onChange={handleOutputChange}
      />

      <p className="text-xs text-gray-500 mb-1">
        <T id="swapRoute" />
      </p>
      <SwapRoute
        trade={bestTrade}
        inputValue={inputValue}
        outputValue={outputValue}
        loadingHasFailed={allRoutePairs.hasFailed}
      />

      <table className={classNames('w-full text-xs text-gray-500 mb-2', styles['swap-form-table'])}>
        <tbody>
          <tr>
            <td>
              <span
                ref={feeInfoIconRef}
                className={classNames('flex w-fit items-center hover:bg-gray-100', 'text-gray-500')}
              >
                <T id="routingFee" />
                &nbsp;
                <InfoIcon className="w-3 h-auto stroke-current" />
              </span>
            </td>
            <td className={classNames('text-right', 'text-gray-600')}>{ROUTING_FEE_PERCENT} %</td>
          </tr>
          <tr>
            <td>
              <T id="exchangeRate" />
            </td>
            <td className="text-right text-gray-600">
              <SwapExchangeRate
                trade={bestTrade}
                inputAssetMetadata={inputAssetMetadata}
                outputAssetMetadata={outputAssetMetadata}
              />
            </td>
          </tr>
          <tr>
            <td>
              <T id="slippageTolerance" />
            </td>
            <td className="justify-end text-gray-600 flex">
              <Controller
                control={control}
                as={SlippageToleranceInput}
                error={!!errors.slippageTolerance}
                name="slippageTolerance"
                rules={{ validate: slippageToleranceInputValidationFn }}
              />
            </td>
          </tr>
          <tr>
            <td>
              <T id="minimumReceived" />
            </td>
            <td className="text-right text-gray-600">
              <SwapMinimumReceived
                minimumReceivedAmount={minimumReceivedAmount.multipliedBy(ROUTING_FEE_RATIO).dividedToIntegerBy(1)}
                outputAssetMetadata={outputAssetMetadata}
              />
            </td>
          </tr>
        </tbody>
      </table>

      <SwapPriceUpdateBar lastUpdateBlock={allRoutePairs.block} />

      {error && (
        <Alert
          className="mb-6"
          type="error"
          title={t('error')}
          description={error.message}
          closable
          onClose={handleErrorClose}
        />
      )}

      <FormSubmitButton
        className="w-full justify-center border-none"
        style={{
          padding: '10px 2rem',
          background: isValid ? '#4299e1' : '#c2c2c2'
        }}
        loading={isSubmitting}
        onClick={handleSubmitButtonClick}
        testID={SwapFormSelectors.SwapSubmit}
      >
        <T id="swap" />
      </FormSubmitButton>
    </form>
  );
};
