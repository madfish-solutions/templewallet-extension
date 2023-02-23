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
  getTradeOutputOperation,
  parseTransferParamsToParamsWithKind,
  Trade,
  useAllRoutePairs,
  useRoutePairsCombinations,
  useTradeWithSlippageTolerance
} from 'swap-router-sdk';

import { Alert, FormSubmitButton } from 'app/atoms';
import { ReactComponent as InfoIcon } from 'app/icons/info.svg';
import { ReactComponent as ToggleIcon } from 'app/icons/toggle.svg';
import OperationStatus from 'app/templates/OperationStatus';
import { setTestID, useFormAnalytics } from 'lib/analytics';
import { EnvVars } from 'lib/env';
import { T, t } from 'lib/i18n';
import { getRoutingFeeTransferParams } from 'lib/swap-router';
import { ROUTING_FEE_ADDRESS, ROUTING_FEE_PERCENT, ROUTING_FEE_RATIO } from 'lib/swap-router/config';
import { useAccount, useTezos, useAssetMetadata } from 'lib/temple/front';
import { atomsToTokens, tokensToAtoms } from 'lib/temple/helpers';
import useTippy from 'lib/ui/useTippy';
import { HistoryAction, navigate } from 'lib/woozie';

import { SwapExchangeRate } from './SwapExchangeRate/SwapExchangeRate';
import { SwapFormValue, SwapInputValue, useSwapFormDefaultValue } from './SwapForm.form';
import styles from './SwapForm.module.css';
import { SwapFormSelectors, SwapFormFromInputSelectors, SwapFormToInputSelectors } from './SwapForm.selectors';
import { feeInfoTippyProps } from './SwapForm.tippy';
import { SlippageToleranceInput } from './SwapFormInput/SlippageToleranceInput/SlippageToleranceInput';
import { slippageToleranceInputValidationFn } from './SwapFormInput/SlippageToleranceInput/SlippageToleranceInput.validation';
import { SwapFormInput } from './SwapFormInput/SwapFormInput';
import { SwapMinimumReceived } from './SwapMinimumReceived/SwapMinimumReceived';
import { SwapPriceUpdateBar } from './SwapPriceUpdateBar/SwapPriceUpdateBar';
import { SwapRoute } from './SwapRoute/SwapRoute';

const TEMPLE_WALLET_DEXES_API_URL = EnvVars.TEMPLE_WALLET_DEXES_API_URL;

const KNOWN_DEX_TYPES = [
  DexTypeEnum.QuipuSwap,
  DexTypeEnum.QuipuSwap20,
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

  const inputAssetMetadata = useAssetMetadata(inputValue.assetSlug ?? 'tez')!;
  const outputAssetMetadata = useAssetMetadata(outputValue.assetSlug ?? 'tez')!;

  const allRoutePairs = useAllRoutePairs(TEMPLE_WALLET_DEXES_API_URL);
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

  const bestTrade = useMemo<Trade>(
    () =>
      inputMutezAmount && routePairsCombinations.length > 0
        ? getBestTradeExactInput(inputMutezAmount, routePairsCombinations)
        : [],
    [inputMutezAmount, routePairsCombinations]
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

  const bestTradeWithSlippageTolerance = useTradeWithSlippageTolerance(inputMutezAmount, bestTrade, slippageTolerance);

  const { feeAmount, minimumReceivedAmount } = useMemo(() => {
    const bestTradeWithSlippageToleranceOutput = getTradeOutputAmount(bestTradeWithSlippageTolerance);
    const tradeOutputOperation = getTradeOutputOperation(bestTradeWithSlippageTolerance);

    if (bestTradeWithSlippageToleranceOutput && tradeOutputOperation) {
      const feeAmount = bestTradeWithSlippageToleranceOutput.minus(
        tradeOutputOperation.bTokenAmount.multipliedBy(ROUTING_FEE_RATIO).dividedToIntegerBy(1)
      );
      const minimumReceivedAmount = bestTradeWithSlippageToleranceOutput.minus(feeAmount);

      return { feeAmount, minimumReceivedAmount };
    } else {
      const feeAmount = new BigNumber(0);
      const minimumReceivedAmount = undefined;

      return { feeAmount, minimumReceivedAmount };
    }
  }, [bestTradeWithSlippageTolerance]);

  useEffect(() => {
    if (bestTrade.length > 0) {
      const bestTradeOutput = getTradeOutputAmount(bestTrade) ?? new BigNumber(0);
      const displayedBestTradeOutput = bestTradeOutput.minus(feeAmount);
      setValue('output', {
        assetSlug: outputValue.assetSlug,
        amount: atomsToTokens(displayedBestTradeOutput, outputAssetMetadata.decimals)
      });
    } else {
      setValue('output', { assetSlug: outputValue.assetSlug, amount: undefined });
    }

    if (isSubmitButtonPressedRef.current) {
      triggerValidation();
    }
  }, [bestTrade, feeAmount, outputAssetMetadata.decimals, outputValue.assetSlug, setValue, triggerValidation]);

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
        bestTradeWithSlippageTolerance,
        feeAmount,
        account.publicKeyHash,
        tezos
      );
      const tradeOpParams = await getTradeOpParams(
        bestTradeWithSlippageTolerance,
        account.publicKeyHash,
        tezos,
        ROUTING_FEE_ADDRESS
      );

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
        testIDs={{
          input: SwapFormFromInputSelectors.input,
          searchInput: SwapFormFromInputSelectors.searchInput,
          assetSelector: SwapFormFromInputSelectors.assetSelector
        }}
      />

      <div className="w-full my-4 flex justify-center">
        <button onClick={handleToggleIconClick} type="button" {...setTestID(SwapFormSelectors.swapPlacesButton)}>
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
        testIDs={{
          input: SwapFormToInputSelectors.input,
          searchInput: SwapFormToInputSelectors.searchInput,
          assetSelector: SwapFormToInputSelectors.assetSelector
        }}
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
                minimumReceivedAmount={minimumReceivedAmount}
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
        testID={SwapFormSelectors.swapButton}
      >
        <T id="swap" />
      </FormSubmitButton>
    </form>
  );
};
