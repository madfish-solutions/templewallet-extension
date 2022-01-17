import React, { FC, useEffect, useMemo, useRef, useState } from 'react';

import { BatchWalletOperation } from '@taquito/taquito/dist/types/wallet/batch-operation';
import classNames from 'clsx';
import { Controller, useForm } from 'react-hook-form';

import Alert from 'app/atoms/Alert';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import { ReactComponent as InfoIcon } from 'app/icons/info.svg';
import { ReactComponent as ToggleIcon } from 'app/icons/toggle.svg';
import OperationStatus from 'app/templates/OperationStatus';
import { useFormAnalytics } from 'lib/analytics';
import { T, t } from 'lib/i18n/react';
import {
  TradeTypeEnum,
  Trade,
  getBestTradeExactInput,
  getBestTradeExactOutput,
  getTradeInputAmount,
  getTradeOutputAmount,
  getRoutingFeeTransferParams,
  getTradeOpParams,
  useRoutePairsCombinations,
  parseTransferParamsToParamsWithKind,
  useTradeWithSlippageTolerance
} from 'lib/swap-router';
import { ROUTING_FEE_INVERTED_RATIO, ROUTING_FEE_PERCENT, ROUTING_FEE_RATIO } from 'lib/swap-router/config';
import { useAccount, useAssetMetadata, useTezos } from 'lib/temple/front';
import { atomsToTokens, tokensToAtoms } from 'lib/temple/helpers';
import useTippy from 'lib/ui/useTippy';
import { HistoryAction, navigate } from 'lib/woozie';

import { SwapExchangeRate } from './SwapExchangeRate/SwapExchangeRate';
import { SwapFormValue, SwapInputValue, useSwapFormDefaultValue } from './SwapForm.form';
import styles from './SwapForm.module.css';
import { feeInfoTippyProps, priceImpactInfoTippyProps } from './SwapForm.tippy';
import { SlippageToleranceInput } from './SwapFormInput/SlippageToleranceInput/SlippageToleranceInput';
import { slippageToleranceInputValidationFn } from './SwapFormInput/SlippageToleranceInput/SlippageToleranceInput.validation';
import { SwapFormInput } from './SwapFormInput/SwapFormInput';
import { SwapMinimumReceived } from './SwapMinimumReceived/SwapMinimumReceived';
import { SwapPriceImpact } from './SwapPriceImpact/SwapPriceImpact';
import { SwapRoute } from './SwapRoute/SwapRoute';

export const SwapForm: FC = () => {
  const tezos = useTezos();
  const account = useAccount();
  const formAnalytics = useFormAnalytics('SwapForm');

  const feeInfoIconRef = useTippy<HTMLSpanElement>(feeInfoTippyProps);
  const priceImpactInfoIconRef = useTippy<HTMLSpanElement>(priceImpactInfoTippyProps);

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
  const [tradeType, setTradeType] = useState(TradeTypeEnum.EXACT_INPUT);
  const routePairsCombinations = useRoutePairsCombinations(inputValue.assetSlug, outputValue.assetSlug);

  const inputMutezAmount = useMemo(
    () => (inputValue.amount ? tokensToAtoms(inputValue.amount, inputAssetMetadata.decimals) : undefined),
    [inputValue.amount, inputAssetMetadata.decimals]
  );
  const inputMutezAmountWithFee = useMemo(
    () => (inputMutezAmount ? inputMutezAmount.multipliedBy(ROUTING_FEE_RATIO).dividedToIntegerBy(1) : undefined),
    [inputMutezAmount]
  );
  const bestTradeWithSlippageTolerance = useTradeWithSlippageTolerance(
    inputMutezAmountWithFee,
    bestTrade,
    slippageTolerance
  );

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

  useEffect(() => {
    if (tradeType === TradeTypeEnum.EXACT_INPUT) {
      if (inputMutezAmountWithFee && routePairsCombinations.length > 0) {
        const bestTradeExactIn = getBestTradeExactInput(inputMutezAmountWithFee, routePairsCombinations);
        const bestTradeOutput = getTradeOutputAmount(bestTradeExactIn);

        const outputTzAmount = bestTradeOutput
          ? atomsToTokens(bestTradeOutput, outputAssetMetadata.decimals)
          : undefined;

        setBestTrade(bestTradeExactIn);
        setValue('output', { assetSlug: outputValue.assetSlug, amount: outputTzAmount });
      } else {
        setBestTrade([]);
        setValue('output', { assetSlug: outputValue.assetSlug, amount: undefined });
      }

      if (isSubmitButtonPressedRef.current) {
        triggerValidation();
      }
    }
  }, [
    inputMutezAmountWithFee,
    outputValue.assetSlug,
    tradeType,
    slippageTolerance,
    routePairsCombinations,
    outputAssetMetadata.decimals,
    setValue,
    triggerValidation
  ]);

  useEffect(() => {
    if (tradeType === TradeTypeEnum.EXACT_OUTPUT) {
      if (outputValue.amount && routePairsCombinations.length > 0) {
        const outputMutezAmount = tokensToAtoms(outputValue.amount, outputAssetMetadata.decimals);

        const bestTradeExactOutput = getBestTradeExactOutput(outputMutezAmount, routePairsCombinations);
        const bestTradeMutezInput = getTradeInputAmount(bestTradeExactOutput);

        const bestTradeMutezInputWithFee = bestTradeMutezInput
          ? bestTradeMutezInput.multipliedBy(ROUTING_FEE_INVERTED_RATIO).dividedToIntegerBy(1)
          : undefined;

        const inputTzAmountWithFee = bestTradeMutezInputWithFee
          ? atomsToTokens(bestTradeMutezInputWithFee, inputAssetMetadata.decimals)
          : undefined;

        setBestTrade(bestTradeExactOutput);
        setValue('input', { assetSlug: inputValue.assetSlug, amount: inputTzAmountWithFee });
      } else {
        setBestTrade([]);
        setValue('input', { assetSlug: inputValue.assetSlug, amount: undefined });
      }

      if (isSubmitButtonPressedRef.current) {
        triggerValidation();
      }
    }
  }, [
    outputValue.amount,
    inputValue.assetSlug,
    tradeType,
    slippageTolerance,
    routePairsCombinations,
    inputAssetMetadata.decimals,
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
        inputMutezAmount,
        bestTradeWithSlippageTolerance,
        account.publicKeyHash,
        tezos
      );
      const tradeOpParams = await getTradeOpParams(bestTradeWithSlippageTolerance, account.publicKeyHash, tezos);

      const opParams = [...routingFeeOpParams, ...tradeOpParams].map(transferParams =>
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
    setValue([{ input: { assetSlug: outputValue.assetSlug } }, { output: { assetSlug: inputValue.assetSlug } }]);

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

  const handleInputAmountChange = () => setTradeType(TradeTypeEnum.EXACT_INPUT);
  const handleOutputAmountChange = () => setTradeType(TradeTypeEnum.EXACT_OUTPUT);

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
        withPercentageButtons={true}
        onChange={handleInputChange}
        onAmountChange={handleInputAmountChange}
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
        onChange={handleOutputChange}
        onAmountChange={handleOutputAmountChange}
      />

      <p className="text-xs text-gray-500 mb-1">
        <T id="swapRoute" />
      </p>
      <SwapRoute trade={bestTrade} inputValue={inputValue} outputValue={outputValue} />

      <table className={classNames('w-full text-xs text-gray-500 mb-6', styles['swap-form-table'])}>
        <tbody>
          <tr>
            <td>
              <span ref={feeInfoIconRef} className="flex w-fit items-center text-gray-500 hover:bg-gray-100">
                <T id="routingFee" />
                &nbsp;
                <InfoIcon className="w-3 h-auto stroke-current" />
              </span>
            </td>
            <td className="text-right text-gray-600">{ROUTING_FEE_PERCENT} %</td>
          </tr>
          <tr>
            <td>
              <span ref={priceImpactInfoIconRef} className="flex w-fit items-center text-gray-500 hover:bg-gray-100">
                <T id="priceImpact" />
                &nbsp;
                <InfoIcon className="w-3 h-auto stroke-current" />
              </span>
            </td>
            <td className="text-right text-gray-600">
              <SwapPriceImpact trade={bestTrade} />
            </td>
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
                tradeWithSlippageTolerance={bestTradeWithSlippageTolerance}
                outputAssetMetadata={outputAssetMetadata}
              />
            </td>
          </tr>
        </tbody>
      </table>

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
      >
        <T id="swap" />
      </FormSubmitButton>
    </form>
  );
};
