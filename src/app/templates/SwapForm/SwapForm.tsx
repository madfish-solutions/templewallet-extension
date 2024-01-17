import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { TransferParams } from '@taquito/taquito';
import { BatchWalletOperation } from '@taquito/taquito/dist/types/wallet/batch-operation';
import BigNumber from 'bignumber.js';
import classNames from 'clsx';
import { Controller, useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';

import { Alert, FormSubmitButton } from 'app/atoms';
import { useBlockLevel } from 'app/hooks/use-block-level.hook';
import { useSwap } from 'app/hooks/use-swap';
import { ReactComponent as InfoIcon } from 'app/icons/info.svg';
import { ReactComponent as ToggleIcon } from 'app/icons/toggle.svg';
import { useSelector } from 'app/store';
import { loadSwapParamsAction, resetSwapParamsAction } from 'app/store/swap/actions';
import { useSwapParamsSelector, useSwapTokenSelector, useSwapTokensSelector } from 'app/store/swap/selectors';
import OperationStatus from 'app/templates/OperationStatus';
import { setTestID, useFormAnalytics } from 'lib/analytics';
import { fetchRoute3SwapParams } from 'lib/apis/route3/fetch-route3-swap-params';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { KNOWN_TOKENS_SLUGS } from 'lib/assets/known-tokens';
import { T, t } from 'lib/i18n';
import { useAssetMetadata, useGetAssetMetadata } from 'lib/metadata';
import {
  BURN_ADDREESS,
  MAX_ROUTING_FEE_CHAINS,
  ROUTING_FEE_ADDRESS,
  ROUTING_FEE_SLIPPAGE_RATIO,
  SWAP_THRESHOLD_TO_GET_CASHBACK,
  TEMPLE_TOKEN,
  ATOMIC_INPUT_THRESHOLD_FOR_FEE_FROM_INPUT
} from 'lib/route3/constants';
import { isLiquidityBakingParamsResponse } from 'lib/route3/interfaces';
import { getPercentageRatio } from 'lib/route3/utils/get-percentage-ratio';
import { getRoute3TokenBySlug } from 'lib/route3/utils/get-route3-token-by-slug';
import { ROUTING_FEE_PERCENT, SWAP_CASHBACK_PERCENT } from 'lib/swap-router/config';
import { useAccount, useTezos } from 'lib/temple/front';
import { atomsToTokens, tokensToAtoms } from 'lib/temple/helpers';
import useTippy from 'lib/ui/useTippy';
import { ZERO } from 'lib/utils/numbers';
import { parseTransferParamsToParamsWithKind } from 'lib/utils/parse-transfer-params';
import {
  calculateFeeFromOutput,
  calculateRoutingInputAndFeeFromInput,
  getRoutingFeeTransferParams
} from 'lib/utils/swap.utils';
import { HistoryAction, navigate } from 'lib/woozie';

import { SwapExchangeRate } from './SwapExchangeRate/SwapExchangeRate';
import { SwapFormValue, SwapInputValue, useSwapFormDefaultValue } from './SwapForm.form';
import styles from './SwapForm.module.css';
import { SwapFormSelectors, SwapFormFromInputSelectors, SwapFormToInputSelectors } from './SwapForm.selectors';
import { cashbackInfoTippyProps, feeInfoTippyProps } from './SwapForm.tippy';
import { SlippageToleranceInput } from './SwapFormInput/SlippageToleranceInput/SlippageToleranceInput';
import { slippageToleranceInputValidationFn } from './SwapFormInput/SlippageToleranceInput/SlippageToleranceInput.validation';
import { SwapFormInput } from './SwapFormInput/SwapFormInput';
import { SwapMinimumReceived } from './SwapMinimumReceived/SwapMinimumReceived';
import { SwapRoute } from './SwapRoute/SwapRoute';

export const SwapForm: FC = () => {
  const dispatch = useDispatch();
  const tezos = useTezos();
  const blockLevel = useBlockLevel();
  const { publicKeyHash } = useAccount();
  const getSwapParams = useSwap();
  const { data: route3Tokens } = useSwapTokensSelector();
  const swapParams = useSwapParamsSelector();
  const allUsdToTokenRates = useSelector(state => state.currency.usdToTokenRates.data);
  const getTokenMetadata = useGetAssetMetadata();
  const prevOutputRef = useRef(swapParams.data.output);

  const formAnalytics = useFormAnalytics('SwapForm');

  const feeInfoIconRef = useTippy<HTMLSpanElement>(feeInfoTippyProps);
  const cashbackInfoIconRef = useTippy<HTMLSpanElement>(cashbackInfoTippyProps);

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

  const inputAssetMetadata = useAssetMetadata(inputValue.assetSlug ?? TEZ_TOKEN_SLUG)!;
  const outputAssetMetadata = useAssetMetadata(outputValue.assetSlug ?? TEZ_TOKEN_SLUG)!;

  const [error, setError] = useState<Error>();
  const [operation, setOperation] = useState<BatchWalletOperation>();
  const isSubmitButtonPressedRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAlertVisible, setIsAlertVisible] = useState(false);

  const slippageRatio = useMemo(() => getPercentageRatio(slippageTolerance ?? 0), [slippageTolerance]);
  const minimumReceivedAmountAtomic = useMemo(() => {
    if (isDefined(swapParams.data.output)) {
      return tokensToAtoms(new BigNumber(swapParams.data.output), outputAssetMetadata.decimals)
        .multipliedBy(slippageRatio)
        .integerValue(BigNumber.ROUND_DOWN);
    } else {
      return ZERO;
    }
  }, [swapParams.data.output, outputAssetMetadata.decimals, slippageRatio]);

  const chainsAreAbsent = isLiquidityBakingParamsResponse(swapParams.data)
    ? swapParams.data.tzbtcChain.chains.length === 0 && swapParams.data.xtzChain.chains.length === 0
    : swapParams.data.chains.length === 0;

  const atomsInputValue = useMemo(
    () => tokensToAtoms(inputValue.amount ?? ZERO, inputAssetMetadata.decimals),
    [inputAssetMetadata.decimals, inputValue.amount]
  );
  const routingFeeIsTakenFromOutput = atomsInputValue.lt(ATOMIC_INPUT_THRESHOLD_FOR_FEE_FROM_INPUT) ?? false;

  useEffect(() => {
    const { swapInputMinusFeeAtomic } = calculateRoutingInputAndFeeFromInput(
      tokensToAtoms(inputValue.amount ?? ZERO, inputAssetMetadata.decimals)
    );

    if (isDefined(fromRoute3Token) && isDefined(toRoute3Token)) {
      dispatch(
        loadSwapParamsAction.submit({
          fromSymbol: fromRoute3Token.symbol,
          toSymbol: toRoute3Token.symbol,
          amount: atomsToTokens(swapInputMinusFeeAtomic, fromRoute3Token.decimals).toFixed()
        })
      );
    }
  }, [blockLevel]);

  useEffect(() => {
    if (Number(swapParams.data.input) > 0 && chainsAreAbsent) {
      setIsAlertVisible(true);
    } else {
      setIsAlertVisible(false);
    }
  }, [chainsAreAbsent, swapParams.data]);

  useEffect(
    () =>
      navigate(
        { pathname: '/swap', search: `from=${inputValue.assetSlug ?? ''}&to=${outputValue.assetSlug ?? ''}` },
        HistoryAction.Replace
      ),
    [inputValue.assetSlug, outputValue.assetSlug]
  );

  useEffect(() => {
    const currentOutput = swapParams.data.output;

    if (currentOutput === prevOutputRef.current) {
      return;
    }

    prevOutputRef.current = currentOutput;
    if (currentOutput === undefined) {
      setValue('output', {
        assetSlug: outputValue.assetSlug,
        amount: undefined
      });
    } else {
      const outputAtomicAmountPlusFee = tokensToAtoms(new BigNumber(currentOutput), outputAssetMetadata.decimals);
      const feeFromOutput = calculateFeeFromOutput(
        tokensToAtoms(inputValue.amount ?? ZERO, inputAssetMetadata.decimals),
        outputAtomicAmountPlusFee
      );
      setValue('output', {
        assetSlug: outputValue.assetSlug,
        amount: atomsToTokens(outputAtomicAmountPlusFee.minus(feeFromOutput), outputAssetMetadata.decimals)
      });
    }

    if (isSubmitButtonPressedRef.current) {
      triggerValidation();
    }
  }, [swapParams.data.output, setValue, triggerValidation]);

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

    const { swapInputMinusFeeAtomic, routingFeeFromInputAtomic } =
      calculateRoutingInputAndFeeFromInput(atomsInputValue);
    const routingFeeFromOutputAtomic = calculateFeeFromOutput(atomsInputValue, minimumReceivedAmountAtomic);

    if (!fromRoute3Token || !toRoute3Token || !swapParams.data.output || !inputValue.assetSlug) {
      return;
    }

    try {
      setOperation(undefined);

      const allSwapParams: Array<TransferParams> = [];
      let routingOutputFeeTransferParams: TransferParams[] = await getRoutingFeeTransferParams(
        toRoute3Token,
        routingFeeFromOutputAtomic,
        publicKeyHash,
        ROUTING_FEE_ADDRESS,
        tezos
      );

      const route3SwapOpParams = await getSwapParams(
        fromRoute3Token,
        toRoute3Token,
        swapInputMinusFeeAtomic,
        minimumReceivedAmountAtomic,
        swapParams.data
      );

      if (!route3SwapOpParams) {
        return;
      }

      const inputTokenExhangeRate = allUsdToTokenRates[inputValue.assetSlug];
      const inputAmountInUsd = inputValue.amount?.multipliedBy(inputTokenExhangeRate) ?? ZERO;

      const isInputTokenTempleToken = inputValue.assetSlug === KNOWN_TOKENS_SLUGS.TEMPLE;
      const isSwapAmountMoreThreshold = inputAmountInUsd.isGreaterThanOrEqualTo(SWAP_THRESHOLD_TO_GET_CASHBACK);

      if (isInputTokenTempleToken && isSwapAmountMoreThreshold) {
        const routingInputFeeOpParams = await getRoutingFeeTransferParams(
          fromRoute3Token,
          routingFeeFromInputAtomic.dividedToIntegerBy(2),
          publicKeyHash,
          BURN_ADDREESS,
          tezos
        );
        allSwapParams.push(...routingInputFeeOpParams);
      } else if (isInputTokenTempleToken && !isSwapAmountMoreThreshold) {
        const routingFeeOpParams = await getRoutingFeeTransferParams(
          TEMPLE_TOKEN,
          routingFeeFromInputAtomic,
          publicKeyHash,
          ROUTING_FEE_ADDRESS,
          tezos
        );
        allSwapParams.push(...routingFeeOpParams);
      } else if (!isInputTokenTempleToken && isSwapAmountMoreThreshold && routingFeeFromInputAtomic.gt(0)) {
        const swapToTempleParams = await fetchRoute3SwapParams({
          fromSymbol: fromRoute3Token.symbol,
          toSymbol: TEMPLE_TOKEN.symbol,
          amount: atomsToTokens(routingFeeFromInputAtomic, fromRoute3Token.decimals).toFixed(),
          chainsLimit: MAX_ROUTING_FEE_CHAINS
        });

        const templeOutputAtomic = tokensToAtoms(
          new BigNumber(swapToTempleParams.output ?? ZERO),
          TEMPLE_TOKEN.decimals
        )
          .multipliedBy(ROUTING_FEE_SLIPPAGE_RATIO)
          .integerValue(BigNumber.ROUND_DOWN);

        const swapToTempleTokenOpParams = await getSwapParams(
          fromRoute3Token,
          TEMPLE_TOKEN,
          routingFeeFromInputAtomic,
          templeOutputAtomic,
          swapToTempleParams
        );

        allSwapParams.push(...swapToTempleTokenOpParams);

        const routingFeeOpParams = await getRoutingFeeTransferParams(
          TEMPLE_TOKEN,
          templeOutputAtomic.dividedToIntegerBy(2),
          publicKeyHash,
          BURN_ADDREESS,
          tezos
        );
        allSwapParams.push(...routingFeeOpParams);
      } else if (!isInputTokenTempleToken && isSwapAmountMoreThreshold) {
        const swapToTempleParams = await fetchRoute3SwapParams({
          fromSymbol: toRoute3Token.symbol,
          toSymbol: TEMPLE_TOKEN.symbol,
          amount: atomsToTokens(routingFeeFromOutputAtomic, toRoute3Token.decimals).toFixed(),
          chainsLimit: MAX_ROUTING_FEE_CHAINS
        });

        const templeOutputAtomic = tokensToAtoms(
          new BigNumber(swapToTempleParams.output ?? ZERO),
          TEMPLE_TOKEN.decimals
        )
          .multipliedBy(ROUTING_FEE_SLIPPAGE_RATIO)
          .integerValue(BigNumber.ROUND_DOWN);

        const swapToTempleTokenOpParams = await getSwapParams(
          toRoute3Token,
          TEMPLE_TOKEN,
          routingFeeFromOutputAtomic,
          templeOutputAtomic,
          swapToTempleParams
        );

        const routingFeeOpParams = await getRoutingFeeTransferParams(
          TEMPLE_TOKEN,
          templeOutputAtomic.dividedToIntegerBy(2),
          publicKeyHash,
          BURN_ADDREESS,
          tezos
        );
        routingOutputFeeTransferParams = [...swapToTempleTokenOpParams, ...routingFeeOpParams];
      } else if (!isInputTokenTempleToken && !isSwapAmountMoreThreshold) {
        const routingInputFeeOpParams = await getRoutingFeeTransferParams(
          fromRoute3Token,
          routingFeeFromInputAtomic,
          publicKeyHash,
          ROUTING_FEE_ADDRESS,
          tezos
        );
        allSwapParams.push(...routingInputFeeOpParams);
      }

      allSwapParams.push(...route3SwapOpParams, ...routingOutputFeeTransferParams);

      const opParams = allSwapParams.map(param => parseTransferParamsToParamsWithKind(param));

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

  const dispatchLoadSwapParams = useCallback((input: SwapInputValue, output: SwapInputValue) => {
    if (!input.assetSlug || !output.assetSlug) {
      return;
    }
    const inputMetadata = getTokenMetadata(input.assetSlug);

    if (!inputMetadata) {
      return;
    }

    const { swapInputMinusFeeAtomic: amount } = calculateRoutingInputAndFeeFromInput(
      tokensToAtoms(input.amount ?? ZERO, inputMetadata.decimals)
    );

    const route3FromToken = getRoute3TokenBySlug(route3Tokens, input.assetSlug);

    dispatch(
      loadSwapParamsAction.submit({
        fromSymbol: route3FromToken?.symbol ?? '',
        toSymbol: getRoute3TokenBySlug(route3Tokens, output.assetSlug)?.symbol ?? '',
        amount: amount && atomsToTokens(amount, route3FromToken?.decimals ?? 0).toFixed()
      })
    );
  }, []);

  const handleErrorClose = () => setError(undefined);
  const handleOperationClose = () => setOperation(undefined);

  const handleToggleIconClick = () => {
    setValue([{ input: { assetSlug: outputValue.assetSlug } }, { output: { assetSlug: inputValue.assetSlug } }]);
    dispatch(resetSwapParamsAction());
  };

  const handleInputChange = (newInputValue: SwapInputValue) => {
    setValue('input', newInputValue);

    if (newInputValue.assetSlug === outputValue.assetSlug) {
      setValue('output', {});
    }

    dispatchLoadSwapParams(newInputValue, outputValue);
  };

  const handleOutputChange = (newOutputValue: SwapInputValue) => {
    setValue('output', newOutputValue);

    if (newOutputValue.assetSlug === inputValue.assetSlug) {
      setValue('input', {});
    }

    dispatchLoadSwapParams(inputValue, newOutputValue);
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
          className="mb-8"
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
          dropdown: SwapFormFromInputSelectors.dropdown,
          input: SwapFormFromInputSelectors.assetInput,
          searchInput: SwapFormFromInputSelectors.searchInput,
          assetDropDownButton: SwapFormFromInputSelectors.assetDropDownButton
        }}
        noItemsText={t('noItemsWithPositiveBalance')}
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
          dropdown: SwapFormToInputSelectors.dropdown,
          input: SwapFormToInputSelectors.assetInput,
          searchInput: SwapFormToInputSelectors.searchInput,
          assetDropDownButton: SwapFormToInputSelectors.assetDropDownButton
        }}
      />

      <FormSubmitButton
        className="w-full justify-center border-none mb-6"
        style={{
          padding: '10px 2rem',
          background: isValid && !isAlertVisible ? '#4299e1' : '#c2c2c2'
        }}
        loading={isSubmitting || swapParams.isLoading}
        keepChildrenWhenLoading={swapParams.isLoading}
        onClick={handleSubmitButtonClick}
        testID={SwapFormSelectors.swapButton}
      >
        <T id={swapParams.isLoading ? 'searchingTheBestRoute' : 'swap'} />
      </FormSubmitButton>

      <div className="pb-2 mb-2 w-full border-b">
        <table className={classNames('w-full text-xs text-gray-500', styles['swap-form-table'])}>
          <tbody>
            <tr>
              <td>
                <span ref={feeInfoIconRef} className="flex w-fit items-center hover:bg-gray-100 text-gray-500">
                  <T id="routingFee" />
                  &nbsp;
                  <InfoIcon className="w-3 h-auto stroke-current" />
                </span>
              </td>
              <td className="text-right text-gray-600">{ROUTING_FEE_PERCENT}%</td>
            </tr>
            <tr>
              <td>
                <T id="exchangeRate" />
              </td>
              <td className="text-right text-gray-600">
                <SwapExchangeRate
                  inputAmount={swapParams.data.input !== undefined ? new BigNumber(swapParams.data.input) : undefined}
                  outputAmount={
                    swapParams.data.output !== undefined ? new BigNumber(swapParams.data.output) : undefined
                  }
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
            <tr>
              <td>
                <span ref={cashbackInfoIconRef} className="flex w-fit items-center hover:bg-gray-100 text-gray-500">
                  <T id="swapCashback" />
                  &nbsp;
                  <InfoIcon className="w-3 h-auto stroke-current" />
                </span>
              </td>
              <td className="text-right text-gray-600">{SWAP_CASHBACK_PERCENT}%</td>
            </tr>
          </tbody>
        </table>
      </div>

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

      <SwapRoute
        isLbInput={isDefined(inputValue.assetSlug) && inputValue.assetSlug === KNOWN_TOKENS_SLUGS.SIRS}
        isLbOutput={isDefined(outputValue.assetSlug) && outputValue.assetSlug === KNOWN_TOKENS_SLUGS.SIRS}
        routingFeeIsTakenFromOutput={routingFeeIsTakenFromOutput}
        outputToken={outputAssetMetadata}
        className="mb-6"
      />

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
