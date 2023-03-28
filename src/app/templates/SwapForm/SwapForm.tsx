import React, { FC, useEffect, useMemo, useRef, useState } from 'react';

import { BatchWalletOperation } from '@taquito/taquito/dist/types/wallet/batch-operation';
import BigNumber from 'bignumber.js';
import classNames from 'clsx';
import { Controller, useForm } from 'react-hook-form';
import { parseTransferParamsToParamsWithKind } from 'swap-router-sdk';

import { Alert, FormSubmitButton } from 'app/atoms';
import { useBlockLevel } from 'app/hooks/use-block-level.hook';
import { useRoute3 } from 'app/hooks/use-route3.hook';
import { ReactComponent as InfoIcon } from 'app/icons/info.svg';
import { ReactComponent as ToggleIcon } from 'app/icons/toggle.svg';
import { useSwapTokenSelector } from 'app/store/swap/selectors';
import OperationStatus from 'app/templates/OperationStatus';
import { setTestID, useFormAnalytics } from 'lib/analytics';
import { fetchRoute3SwapParams, Route3SwapParamsResponse } from 'lib/apis/route3/fetch-route3-swap-params';
import { T, t } from 'lib/i18n';
import { ROUTING_FEE_RATIO, ZERO } from 'lib/route3/constants';
import { getPercentageRatio } from 'lib/route3/utils/get-percentage-ratio';
import { getRoutingFeeTransferParams } from 'lib/route3/utils/get-routing-fee-transfer-params';
import { createEntity, LoadableEntityState } from 'lib/store';
import { ROUTING_FEE_PERCENT } from 'lib/swap-router/config';
import { useAccount, useAssetMetadata, useTezos } from 'lib/temple/front';
import { tokensToAtoms } from 'lib/temple/helpers';
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
import { SwapRoute } from './SwapRoute/SwapRoute';

export const SwapForm: FC = () => {
  const tezos = useTezos();
  const blockLevel = useBlockLevel();
  const { publicKeyHash } = useAccount();
  const getRoute3SwapOpParams = useRoute3();
  const [swapParams, setSwapParams] = useState<LoadableEntityState<Route3SwapParamsResponse>>(
    createEntity({ input: ZERO, output: ZERO, chains: [] })
  );

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

  const fromRoute3Token = useSwapTokenSelector(inputValue.assetSlug ?? '');

  const toRoute3Token = useSwapTokenSelector(outputValue.assetSlug ?? '');

  const inputAssetMetadata = useAssetMetadata(inputValue.assetSlug ?? 'tez')!;
  const outputAssetMetadata = useAssetMetadata(outputValue.assetSlug ?? 'tez')!;

  const [error, setError] = useState<Error>();
  const [operation, setOperation] = useState<BatchWalletOperation>();
  const isSubmitButtonPressedRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAlertVisible, setIsAlertVisible] = useState<boolean>(false);

  const slippageRatio = useMemo(() => getPercentageRatio(slippageTolerance ?? 0), [slippageTolerance]);
  const { routingFeeAtomic, minimumReceivedAmountAtomic } = useMemo(() => {
    if (swapParams.data.output !== undefined) {
      const swapOutputAtomic = tokensToAtoms(new BigNumber(swapParams.data.output), outputAssetMetadata.decimals);
      const routingFeeAtomic = swapOutputAtomic
        .minus(swapOutputAtomic.multipliedBy(ROUTING_FEE_RATIO))
        .integerValue(BigNumber.ROUND_DOWN);
      const minimumReceivedAmountAtomic = swapOutputAtomic
        .minus(routingFeeAtomic)
        .multipliedBy(slippageRatio)
        .integerValue(BigNumber.ROUND_DOWN);

      return { routingFeeAtomic, minimumReceivedAmountAtomic };
    } else {
      return { routingFeeAtomic: ZERO, minimumReceivedAmountAtomic: ZERO };
    }
  }, [slippageRatio, outputValue.amount, swapParams.data.output]);

  const loadSwapParams = () => {
    if (!fromRoute3Token || !toRoute3Token || !inputValue.amount) {
      return;
    }
    setSwapParams(prevState => createEntity(prevState.data, true));

    fetchRoute3SwapParams({
      fromSymbol: fromRoute3Token.symbol,
      toSymbol: toRoute3Token.symbol,
      amount: inputValue.amount.toFixed()
    })
      .then(params => {
        setSwapParams(createEntity(params));

        if (params.input?.isGreaterThan(ZERO) && params.chains.length === 0) {
          setIsAlertVisible(true);
        } else {
          setIsAlertVisible(false);
        }
      })
      .catch(error => setSwapParams(prevState => createEntity(prevState.data, false, error.message)));
  };

  useEffect(() => loadSwapParams(), [blockLevel]);
  useEffect(() => loadSwapParams(), [inputValue.assetSlug, outputValue.assetSlug, inputValue.amount]);

  useEffect(
    () =>
      navigate(
        { pathname: '/swap', search: `from=${inputValue.assetSlug ?? ''}&to=${outputValue.assetSlug ?? ''}` },
        HistoryAction.Replace
      ),
    [inputValue.assetSlug, outputValue.assetSlug]
  );

  useEffect(() => {
    setValue('output', {
      assetSlug: outputValue.assetSlug,
      amount: swapParams.data.output === undefined ? undefined : new BigNumber(swapParams.data.output)
    });

    if (isSubmitButtonPressedRef.current) {
      triggerValidation();
    }
  }, [outputAssetMetadata.decimals, outputValue.assetSlug, swapParams.data.output, setValue, triggerValidation]);

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

    if (!fromRoute3Token || !toRoute3Token || !inputValue.amount) {
      return;
    }

    try {
      setOperation(undefined);

      const route3SwapOpParams = await getRoute3SwapOpParams(
        fromRoute3Token,
        toRoute3Token,
        inputValue.amount,
        minimumReceivedAmountAtomic,
        swapParams.data.chains
      );

      if (!route3SwapOpParams) {
        return;
      }

      const routingFeeOpParams = await getRoutingFeeTransferParams(
        toRoute3Token,
        routingFeeAtomic,
        publicKeyHash,
        tezos
      );

      const opParams = [...route3SwapOpParams, ...routingFeeOpParams].map(param =>
        parseTransferParamsToParamsWithKind(param)
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
      setSwapParams(createEntity({ input: ZERO, output: ZERO, chains: [] }));
    }
  };

  const handleOutputChange = (newOutputValue: SwapInputValue) => {
    setValue('output', newOutputValue);

    if (newOutputValue.assetSlug === inputValue.assetSlug) {
      setValue('input', {});
      setSwapParams(createEntity({ input: ZERO, output: ZERO, chains: [] }));
    }
  };

  const handleSubmitButtonClick = () => (isSubmitButtonPressedRef.current = true);

  const handleCloseAlert = () => setIsAlertVisible(false);

  return (
    <form className="mb-8" onSubmit={handleSubmit(onSubmit)}>
      {isAlertVisible && (
        <Alert
          closable
          className="mb-4"
          type="error"
          description={<T id="noRoutesFound" />}
          onClose={handleCloseAlert}
        />
      )}

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
          input: SwapFormFromInputSelectors.assetInput,
          searchInput: SwapFormFromInputSelectors.searchInput,
          assetSelector: SwapFormFromInputSelectors.assetItem
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
          input: SwapFormToInputSelectors.assetInput,
          searchInput: SwapFormToInputSelectors.searchInput,
          assetSelector: SwapFormToInputSelectors.assetItem
        }}
      />

      <FormSubmitButton
        className="w-full justify-center border-none mb-6"
        style={{
          padding: '10px 2rem',
          background: isValid ? '#4299e1' : '#c2c2c2'
        }}
        loading={isSubmitting}
        searchingRoute={swapParams.isLoading}
        onClick={handleSubmitButtonClick}
        testID={SwapFormSelectors.swapButton}
      >
        <T id="swap" />
      </FormSubmitButton>

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
                inputAmount={swapParams.data.input}
                outputAmount={swapParams.data.output}
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
                minimumReceivedAmount={minimumReceivedAmountAtomic}
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

      <SwapRoute className="mb-6" swapParams={swapParams.data} />

      <p className="text-center text-gray-700 max-w-xs m-auto">
        <span className="mr-1">
          <T id="swapRoute3Description" />
        </span>
        <a className="underline" href="https://3route.io" target="_blank" rel="noreferrer">
          <T id="swapRoute3Link" />
        </a>
      </p>
    </form>
  );
};
