import React, { FC, useEffect, useMemo, useRef, useState } from 'react';

import { BatchWalletOperation } from '@taquito/taquito/dist/types/wallet/batch-operation';
import BigNumber from 'bignumber.js';
import classNames from 'clsx';
import { Controller, useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { parseTransferParamsToParamsWithKind } from 'swap-router-sdk';

import { Alert, FormSubmitButton } from 'app/atoms';
import { useRoute3 } from 'app/hooks/use-route3.hook';
import { ReactComponent as InfoIcon } from 'app/icons/info.svg';
import { ReactComponent as ToggleIcon } from 'app/icons/toggle.svg';
import {
  loadRoute3DexesAction,
  loadRoute3SwapParamsAction,
  resetRoute3SwapParamsAction
} from 'app/store/route3/actions';
import { useRoute3SwapParamsSelector, useRoute3TokenSelector } from 'app/store/route3/selectors';
import OperationStatus from 'app/templates/OperationStatus';
import { useFormAnalytics } from 'lib/analytics';
import { T, t } from 'lib/i18n';
import { ROUTE3_CONTRACT } from 'lib/route3/constants';
import { ROUTING_FEE_PERCENT } from 'lib/swap-router/config';
import { useAccount, useAssetMetadata, useTezos } from 'lib/temple/front';
import useTippy from 'lib/ui/useTippy';
import { getTransferPermissions } from 'lib/utils/get-transfer-permissions';
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
import { SwapRoute } from './SwapRoute/SwapRoute';

export const SwapForm: FC = () => {
  const dispatch = useDispatch();
  const tezos = useTezos();
  const { publicKeyHash } = useAccount();
  const { getRoute3SwapOpParams } = useRoute3();
  const { data: swapParams } = useRoute3SwapParamsSelector();

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

  const fromRoute3Token = useRoute3TokenSelector(inputValue.assetSlug ?? '');
  const toRoute3Token = useRoute3TokenSelector(outputValue.assetSlug ?? '');

  const inputAssetMetadata = useAssetMetadata(inputValue.assetSlug ?? 'tez')!;
  const outputAssetMetadata = useAssetMetadata(outputValue.assetSlug ?? 'tez')!;

  const [error, setError] = useState<Error>();
  const [operation, setOperation] = useState<BatchWalletOperation>();
  const isSubmitButtonPressedRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const slippageRatio = useMemo(() => (100 - (slippageTolerance ?? 0)) / 100, [slippageTolerance]);
  const minimumReceivedAmount = useMemo(
    () => slippageRatio * (outputValue.amount?.toNumber() ?? 0),
    [slippageRatio, outputValue.amount]
  );

  useEffect(() => {
    if (!fromRoute3Token || !toRoute3Token || !inputValue.amount) {
      return;
    }

    dispatch(
      loadRoute3SwapParamsAction.submit({
        fromSymbol: fromRoute3Token.symbol,
        toSymbol: toRoute3Token.symbol,
        amount: inputValue.amount.toFixed()
      })
    );
  }, [inputValue.assetSlug, outputValue.assetSlug, inputValue.amount]);

  useEffect(
    () =>
      navigate(
        { pathname: '/swap', search: `from=${inputValue.assetSlug ?? ''}&to=${outputValue.assetSlug ?? ''}` },
        HistoryAction.Replace
      ),
    [inputValue.assetSlug, outputValue.assetSlug]
  );

  useEffect(() => {
    dispatch(loadRoute3DexesAction.submit());
    dispatch(resetRoute3SwapParamsAction());

    const subscription = tezos.stream.subscribeBlock('head');
    subscription.on('data', () => {
      if (fromRoute3Token && toRoute3Token && inputValue.amount) {
        dispatch(
          loadRoute3SwapParamsAction.submit({
            fromSymbol: fromRoute3Token.symbol,
            toSymbol: toRoute3Token.symbol,
            amount: inputValue.amount?.toFixed() ?? '0'
          })
        );
      }
    });

    return () => subscription.close();
  }, []);

  useEffect(() => {
    setValue('output', {
      assetSlug: outputValue.assetSlug,
      amount: swapParams.output === undefined ? undefined : new BigNumber(swapParams.output)
    });

    if (isSubmitButtonPressedRef.current) {
      triggerValidation();
    }
  }, [outputAssetMetadata.decimals, outputValue.assetSlug, swapParams.output, setValue, triggerValidation]);

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
        slippageRatio
      );

      const { approve, revoke } = await getTransferPermissions(
        tezos,
        ROUTE3_CONTRACT,
        publicKeyHash,
        fromRoute3Token,
        inputValue.amount
      );

      const opParams = [...approve, route3SwapOpParams, ...revoke].map(param =>
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
    }

    if (newInputValue.amount === undefined) {
      dispatch(resetRoute3SwapParamsAction());
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

      <FormSubmitButton
        className="w-full justify-center border-none mb-6"
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
                inputAmount={swapParams.input}
                outputAmount={swapParams.output}
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

      <SwapRoute className="mb-6" />

      <p className="text-center text-gray-700">
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
