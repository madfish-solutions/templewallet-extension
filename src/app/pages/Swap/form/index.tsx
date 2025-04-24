import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { TransferParams } from '@taquito/taquito';
import { BatchWalletOperation } from '@taquito/taquito/dist/types/wallet/batch-operation';
import BigNumber from 'bignumber.js';
import { Controller, useForm } from 'react-hook-form-v7';

import { IconBase } from 'app/atoms';
import { ActionsButtonsBox } from 'app/atoms/PageModal';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as SwapIcon } from 'app/icons/base/swap.svg';
import { buildSwapPageUrlQuery } from 'app/pages/Swap/build-url-query';
import SwapFormInput, { EXCHANGE_XTZ_RESERVE } from 'app/pages/Swap/form/SwapFormInput';
import { dispatch, useSelector } from 'app/store';
import { setOnRampPossibilityAction } from 'app/store/settings/actions';
import { loadSwapParamsAction, resetSwapParamsAction } from 'app/store/swap/actions';
import { useSwapParamsSelector, useSwapTokenSelector, useSwapTokensSelector } from 'app/store/swap/selectors';
import OperationStatus from 'app/templates/OperationStatus';
import { toastError } from 'app/toaster';
import { setTestID, useFormAnalytics } from 'lib/analytics';
import { fetchRoute3SwapParams } from 'lib/apis/route3/fetch-route3-swap-params';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { KNOWN_TOKENS_SLUGS } from 'lib/assets/known-tokens';
import { useGetTezosAccountTokenOrGasBalanceWithDecimals } from 'lib/balances/hooks';
import { TEZ_BURN_ADDRESS } from 'lib/constants';
import { useAssetFiatCurrencyPrice } from 'lib/fiat-currency';
import { useAssetUSDPrice } from 'lib/fiat-currency/core';
import { T, t, toLocalFixed } from 'lib/i18n';
import { useCategorizedTezosAssetMetadata, useGetCategorizedAssetMetadata } from 'lib/metadata';
import {
  ROUTING_FEE_ADDRESS,
  ROUTING_FEE_RATIO,
  ROUTING_FEE_SLIPPAGE_RATIO,
  SWAP_CASHBACK_RATIO,
  SWAP_THRESHOLD_TO_GET_CASHBACK,
  TEMPLE_TOKEN
} from 'lib/route3/constants';
import { isLiquidityBakingParamsResponse } from 'lib/route3/interfaces';
import { getPercentageRatio } from 'lib/route3/utils/get-percentage-ratio';
import { getRoute3TokenBySlug } from 'lib/route3/utils/get-route3-token-by-slug';
import { atomsToTokens, tokensToAtoms } from 'lib/temple/helpers';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { ZERO } from 'lib/utils/numbers';
import { parseTransferParamsToParamsWithKind } from 'lib/utils/parse-transfer-params';
import {
  calculateSidePaymentsFromInput,
  getRoutingFeeTransferParams,
  multiplyAtomicAmount,
  calculateOutputAmounts
} from 'lib/utils/swap.utils';
import { HistoryAction, navigate } from 'lib/woozie';
import { AccountForTezos } from 'temple/accounts';
import { getTezosToolkitWithSigner, useTezosBlockLevel, useTezosMainnetChain } from 'temple/front';

import { EXCHANGE_XTZ_RESERVE } from '../constants';

import { TezosReviewData } from './interfaces';
import { SwapFormValue, SwapInputValue, useSwapFormDefaultValue } from './SwapForm.form';
import { SwapFormSelectors, SwapFormFromInputSelectors, SwapFormToInputSelectors } from './SwapForm.selectors';
import { SwapInfoDropdown } from './SwapInfoDropdown';
import { useGetSwapTransferParams } from './use-swap-params';

const CASHBACK_SWAP_MAX_DEXES = 3;
// Actually, at most 2 dexes for each of underlying SIRS -> tzBTC -> X swap and SIRS -> XTZ -> X swap
const MAIN_SIRS_SWAP_MAX_DEXES = 4;
const MAIN_NON_SIRS_SWAP_MAX_DEXES = 3;

interface Props {
  account: AccountForTezos;
  slippageTolerance: number;
  onReview: SyncFn<TezosReviewData>;
}

export const SwapForm = memo<Props>(({ account, slippageTolerance, onReview }) => {
  const network = useTezosMainnetChain();

  const publicKeyHash = account.address;
  const tezos = getTezosToolkitWithSigner(network.rpcBaseURL, publicKeyHash);

  const blockLevel = useTezosBlockLevel(network.rpcBaseURL);
  const prevBlockLevelRef = useRef(blockLevel);
  const getSwapParams = useGetSwapTransferParams(tezos, publicKeyHash);
  const { data: route3Tokens } = useSwapTokensSelector();
  const swapParams = useSwapParamsSelector();
  const allUsdToTokenRates = useSelector(state => state.currency.usdToTokenRates.data);
  const getTokenMetadata = useGetCategorizedAssetMetadata(TEZOS_MAINNET_CHAIN_ID);
  const prevOutputRef = useRef(swapParams.data.output);
  const getTezosBalance = useGetTezosAccountTokenOrGasBalanceWithDecimals(publicKeyHash);

  const formAnalytics = useFormAnalytics('Index');

  const defaultValues = useSwapFormDefaultValue();
  const {
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { isSubmitting, submitCount, errors }
  } = useForm<SwapFormValue>({
    defaultValues,
    mode: 'onSubmit',
    reValidateMode: 'onChange'
  });
  const isValid = Object.keys(errors).length === 0;

  const inputValue = watch('input');
  const outputValue = watch('output');

  const { value: inputTokenBalance = ZERO } = useTezosAssetBalance(
    inputValue.assetSlug ?? TEZ_TOKEN_SLUG,
    publicKeyHash,
    network
  );

  const fromRoute3Token = useSwapTokenSelector(inputValue.assetSlug ?? '');
  const toRoute3Token = useSwapTokenSelector(outputValue.assetSlug ?? '');

  const inputAssetMetadata = useCategorizedTezosAssetMetadata(
    inputValue.assetSlug ?? TEZ_TOKEN_SLUG,
    TEZOS_MAINNET_CHAIN_ID
  )!;

  const outputAssetMetadata = useCategorizedTezosAssetMetadata(
    outputValue.assetSlug ?? TEZ_TOKEN_SLUG,
    TEZOS_MAINNET_CHAIN_ID
  )!;

  const [operation, setOperation] = useState<BatchWalletOperation>();
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [shouldUseFiat, setShouldUseFiat] = useState(false);

  useEffect(() => {
    if (isAlertVisible) {
      toastError(t('noRoutesFound'));
    }
  }, [isAlertVisible]);

  const slippageRatio = useMemo(() => getPercentageRatio(slippageTolerance ?? 0), [slippageTolerance]);
  const { outputAtomicAmountBeforeFee, minimumReceivedAtomic, outputFeeAtomicAmount } = useMemo(
    () =>
      calculateOutputAmounts(
        inputValue.amount,
        inputAssetMetadata.decimals,
        swapParams.data.output,
        outputAssetMetadata.decimals,
        slippageRatio
      ),
    [
      inputValue.amount,
      inputAssetMetadata.decimals,
      swapParams.data.output,
      outputAssetMetadata.decimals,
      slippageRatio
    ]
  );

  const swapRouteSteps = useMemo(() => {
    let hopLength = 0;

    if (isLiquidityBakingParamsResponse(swapParams.data)) {
      hopLength = (swapParams.data.tzbtcHops?.length || 0) + (swapParams.data.xtzHops?.length || 0);
    } else if ('hops' in swapParams.data) {
      hopLength = swapParams.data.hops?.length || 0;
    }

    return hopLength;
  }, [swapParams]);

  const hopsAreAbsent = isLiquidityBakingParamsResponse(swapParams.data)
    ? swapParams.data.tzbtcHops.length === 0 && swapParams.data.xtzHops.length === 0
    : swapParams.data.hops.length === 0;

  const atomsInputValue = useMemo(
    () => tokensToAtoms(inputValue.amount ?? ZERO, inputAssetMetadata.decimals),
    [inputAssetMetadata.decimals, inputValue.amount]
  );

  const getSwapWithFeeParams = useCallback(
    (newInputValue: SwapInputValue, newOutputValue: SwapInputValue) => {
      const { assetSlug: inputAssetSlug, amount: inputAmount } = newInputValue;
      const outputAssetSlug = newOutputValue.assetSlug;
      const inputTokenExchangeRate = inputAssetSlug ? allUsdToTokenRates[inputAssetSlug] : '0';
      const inputAmountInUsd = inputAmount?.multipliedBy(inputTokenExchangeRate) ?? ZERO;

      const isInputTokenTempleToken = inputAssetSlug === KNOWN_TOKENS_SLUGS.TEMPLE;
      const isOutputTokenTempleToken = outputAssetSlug === KNOWN_TOKENS_SLUGS.TEMPLE;
      const isSirsSwap = inputAssetSlug === KNOWN_TOKENS_SLUGS.SIRS || outputAssetSlug === KNOWN_TOKENS_SLUGS.SIRS;
      const isSwapAmountMoreThreshold = inputAmountInUsd.isGreaterThanOrEqualTo(SWAP_THRESHOLD_TO_GET_CASHBACK);
      const mainSwapMaxDexes = isSirsSwap ? MAIN_SIRS_SWAP_MAX_DEXES : MAIN_NON_SIRS_SWAP_MAX_DEXES;

      return {
        isInputTokenTempleToken,
        isOutputTokenTempleToken,
        isSwapAmountMoreThreshold,
        mainSwapMaxDexes
      };
    },
    [allUsdToTokenRates]
  );

  const inputAssetPrice = useAssetFiatCurrencyPrice(inputValue.assetSlug ?? '', network.chainId);

  const price = useAssetUSDPrice(outputValue.assetSlug ?? TEZ_TOKEN_SLUG, network.chainId);
  const outputAmountInUSD = (price && BigNumber(price).times(outputValue.amount || 0)) || BigNumber(0);

  const toAssetAmount = useCallback(
    (fiatAmount: BigNumber.Value = ZERO, assetDecimals: number = 2) => {
      return new BigNumber(fiatAmount || '0')
        .dividedBy(inputAssetPrice ?? 1)
        .decimalPlaces(assetDecimals, BigNumber.ROUND_FLOOR);
    },
    [inputAssetPrice]
  );

  const dispatchLoadSwapParams = useCallback(
    (input: SwapInputValue, output: SwapInputValue, useFiat?: boolean) => {
      if (!input.assetSlug || !output.assetSlug) {
        return;
      }
      const inputMetadata = getTokenMetadata(input.assetSlug);

      if (!inputMetadata) {
        return;
      }

      const inputValueToUse = useFiat ? toAssetAmount(input.amount, inputAssetMetadata.decimals) : input.amount;

      const { swapInputMinusFeeAtomic: amount } = calculateSidePaymentsFromInput(
        tokensToAtoms(inputValueToUse ?? ZERO, inputMetadata.decimals)
      );

      const route3FromToken = getRoute3TokenBySlug(route3Tokens, input.assetSlug);
      const route3ToToken = getRoute3TokenBySlug(route3Tokens, output.assetSlug);
      const { mainSwapMaxDexes } = getSwapWithFeeParams(input, output);

      dispatch(
        loadSwapParamsAction.submit({
          fromSymbol: route3FromToken?.symbol ?? '',
          toSymbol: route3ToToken?.symbol ?? '',
          toTokenDecimals: route3ToToken?.decimals ?? 0,
          amount: atomsToTokens(amount, route3FromToken?.decimals ?? 0).toFixed(),
          dexesLimit: mainSwapMaxDexes,
          rpcUrl: tezos.rpc.getRpcUrl()
        })
      );
    },
    [getTokenMetadata, toAssetAmount, inputAssetMetadata.decimals, route3Tokens, getSwapWithFeeParams, tezos.rpc]
  );

  useEffect(() => {
    if (isDefined(fromRoute3Token) && isDefined(toRoute3Token) && prevBlockLevelRef.current !== blockLevel) {
      dispatchLoadSwapParams(inputValue, outputValue, shouldUseFiat);
    }
    prevBlockLevelRef.current = blockLevel;
  }, [blockLevel, dispatchLoadSwapParams, fromRoute3Token, inputValue, outputValue, toRoute3Token, shouldUseFiat]);

  useEffect(() => {
    if (Number(swapParams.data.input) > 0 && hopsAreAbsent) {
      setIsAlertVisible(true);
    } else {
      setIsAlertVisible(false);
    }
  }, [hopsAreAbsent, swapParams.data]);

  useEffect(
    () =>
      navigate(
        { pathname: '/swap', search: buildSwapPageUrlQuery(inputValue.assetSlug, outputValue.assetSlug) },
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
      const inputValueToUse = shouldUseFiat
        ? toAssetAmount(inputValue.amount, inputAssetMetadata.decimals)
        : inputValue.amount;
      const { expectedReceivedAtomic } = calculateOutputAmounts(
        inputValueToUse,
        inputAssetMetadata.decimals,
        currentOutput,
        outputAssetMetadata.decimals,
        slippageRatio
      );
      setValue('output', {
        assetSlug: outputValue.assetSlug,
        amount: atomsToTokens(expectedReceivedAtomic, outputAssetMetadata.decimals)
      });
    }
  }, [
    slippageRatio,
    swapParams.data.output,
    setValue,
    outputValue.assetSlug,
    outputAssetMetadata.decimals,
    inputValue.amount,
    inputAssetMetadata.decimals,
    shouldUseFiat,
    toAssetAmount
  ]);

  const validateField = useCallback(({ assetSlug }: SwapInputValue) => {
    if (!assetSlug) return t('assetMustBeSelected');

    return true;
  }, []);

  const inputTokenMaxAmount = useMemo(() => {
    if (!inputValue.assetSlug) return new BigNumber(0);
    return (
      (inputValue.assetSlug === TEZ_TOKEN_SLUG ? inputTokenBalance?.minus(EXCHANGE_XTZ_RESERVE) : inputTokenBalance) ??
      new BigNumber(0)
    );
  }, [inputTokenBalance, inputValue.assetSlug]);

  const validateInputField = useCallback(
    (props: SwapInputValue) => {
      if (props.amount?.isLessThanOrEqualTo(0)) return t('amountMustBePositive');

      if (props.amount?.gt(inputTokenMaxAmount)) {
        return t('maximalAmount', toLocalFixed(inputTokenMaxAmount, Math.min(inputAssetMetadata.decimals, 6)));
      }

      return validateField(props);
    },
    [inputAssetMetadata.decimals, inputTokenMaxAmount, validateField]
  );

  const resetForm = useCallback(() => {
    reset(defaultValues);
    setShouldUseFiat(false);
  }, [defaultValues, reset]);

  const onSubmit = async () => {
    if (isSubmitting) return;

    // TODO: add `toastUniqWarning(t('notEnoughTezForFee'), true)` call if the balance of the EVM native token is too low
    if (
      inputValue.assetSlug === TEZ_TOKEN_SLUG &&
      getTezosBalance(TEZOS_MAINNET_CHAIN_ID, TEZ_TOKEN_SLUG)?.lte(EXCHANGE_XTZ_RESERVE)
    ) {
      dispatch(setOnRampPossibilityAction(true));

      return;
    }

    const analyticsProperties = {
      inputAsset: inputValue.assetSlug,
      outputAsset: outputValue.assetSlug
    };

    formAnalytics.trackSubmit(analyticsProperties);

    const {
      swapInputMinusFeeAtomic,
      inputFeeAtomic: routingFeeFromInputAtomic,
      cashbackSwapInputAtomic: cashbackSwapInputFromInAtomic
    } = calculateSidePaymentsFromInput(atomsInputValue);

    if (!fromRoute3Token || !toRoute3Token || !swapParams.data.output || !inputValue.assetSlug) {
      return;
    }

    try {
      setOperation(undefined);

      const allSwapParams: Array<TransferParams> = [];
      let routingOutputFeeTransferParams: TransferParams[] = await getRoutingFeeTransferParams(
        toRoute3Token,
        outputFeeAtomicAmount,
        publicKeyHash,
        ROUTING_FEE_ADDRESS,
        tezos
      );

      const route3SwapOpParams = await getSwapParams(
        fromRoute3Token,
        toRoute3Token,
        swapInputMinusFeeAtomic,
        outputAtomicAmountBeforeFee,
        slippageRatio,
        swapParams.data
      );

      if (route3SwapOpParams.length === 0) {
        return;
      }

      const { isInputTokenTempleToken, isOutputTokenTempleToken, isSwapAmountMoreThreshold } = getSwapWithFeeParams(
        inputValue,
        outputValue
      );

      let cashback;

      if (isInputTokenTempleToken && isSwapAmountMoreThreshold) {
        const routingInputFeeOpParams = await getRoutingFeeTransferParams(
          fromRoute3Token,
          routingFeeFromInputAtomic.minus(cashbackSwapInputFromInAtomic),
          publicKeyHash,
          TEZ_BURN_ADDRESS,
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
          toTokenDecimals: TEMPLE_TOKEN.decimals,
          amount: atomsToTokens(routingFeeFromInputAtomic, fromRoute3Token.decimals).toFixed(),
          dexesLimit: CASHBACK_SWAP_MAX_DEXES,
          rpcUrl: tezos.rpc.getRpcUrl()
        });

        const templeExpectedOutputAtomic = tokensToAtoms(
          new BigNumber(swapToTempleParams.output ?? ZERO),
          TEMPLE_TOKEN.decimals
        );
        const templeMinOutputAtomic = multiplyAtomicAmount(
          templeExpectedOutputAtomic,
          ROUTING_FEE_SLIPPAGE_RATIO,
          BigNumber.ROUND_DOWN
        );

        const swapToTempleTokenOpParams = await getSwapParams(
          fromRoute3Token,
          TEMPLE_TOKEN,
          routingFeeFromInputAtomic,
          templeExpectedOutputAtomic,
          ROUTING_FEE_SLIPPAGE_RATIO,
          swapToTempleParams
        );

        allSwapParams.push(...swapToTempleTokenOpParams);

        const burnAmount = templeMinOutputAtomic
          .times(ROUTING_FEE_RATIO - SWAP_CASHBACK_RATIO)
          .dividedToIntegerBy(ROUTING_FEE_RATIO);

        cashback = templeExpectedOutputAtomic.minus(burnAmount);

        const routingFeeOpParams = await getRoutingFeeTransferParams(
          TEMPLE_TOKEN,
          burnAmount,
          publicKeyHash,
          TEZ_BURN_ADDRESS,
          tezos
        );
        allSwapParams.push(...routingFeeOpParams);
      } else if (!isInputTokenTempleToken && isSwapAmountMoreThreshold && isOutputTokenTempleToken) {
        routingOutputFeeTransferParams = await getRoutingFeeTransferParams(
          TEMPLE_TOKEN,
          outputFeeAtomicAmount.times(ROUTING_FEE_RATIO - SWAP_CASHBACK_RATIO).dividedToIntegerBy(ROUTING_FEE_RATIO),
          publicKeyHash,
          TEZ_BURN_ADDRESS,
          tezos
        );
      } else if (!isInputTokenTempleToken && isSwapAmountMoreThreshold) {
        const swapToTempleParams = await fetchRoute3SwapParams({
          fromSymbol: toRoute3Token.symbol,
          toSymbol: TEMPLE_TOKEN.symbol,
          toTokenDecimals: TEMPLE_TOKEN.decimals,
          amount: atomsToTokens(outputFeeAtomicAmount, toRoute3Token.decimals).toFixed(),
          dexesLimit: CASHBACK_SWAP_MAX_DEXES,
          rpcUrl: tezos.rpc.getRpcUrl()
        });

        const templeExpectedOutputAtomic = tokensToAtoms(
          new BigNumber(swapToTempleParams.output ?? ZERO),
          TEMPLE_TOKEN.decimals
        );
        const templeMinOutputAtomic = multiplyAtomicAmount(
          templeExpectedOutputAtomic,
          ROUTING_FEE_SLIPPAGE_RATIO,
          BigNumber.ROUND_DOWN
        );

        const swapToTempleTokenOpParams = await getSwapParams(
          toRoute3Token,
          TEMPLE_TOKEN,
          outputFeeAtomicAmount,
          templeExpectedOutputAtomic,
          ROUTING_FEE_SLIPPAGE_RATIO,
          swapToTempleParams
        );

        const burnAmount = templeMinOutputAtomic
          .times(ROUTING_FEE_RATIO - SWAP_CASHBACK_RATIO)
          .dividedToIntegerBy(ROUTING_FEE_RATIO);

        cashback = templeExpectedOutputAtomic.minus(burnAmount);

        const routingFeeOpParams = await getRoutingFeeTransferParams(
          TEMPLE_TOKEN,
          burnAmount,
          publicKeyHash,
          TEZ_BURN_ADDRESS,
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

      onReview({
        opParams,
        account,
        network,
        cashbackInTkey: cashback ? atomsToTokens(new BigNumber(cashback), TEMPLE_TOKEN.decimals).toString() : undefined,
        minimumReceived: {
          amount: atomsToTokens(new BigNumber(minimumReceivedAtomic), outputAssetMetadata.decimals).toString(),
          symbol: outputAssetMetadata.symbol
        },
        onConfirm: o => {
          resetForm();
          setOperation(o);
        }
      });

      formAnalytics.trackSubmitSuccess(analyticsProperties);
    } catch (err: any) {
      console.error(err);
      if (err.message !== 'Declined') {
        toastError(err.message);
      }
      formAnalytics.trackSubmitFail(analyticsProperties);
    }
  };

  const handleToggleIconClick = () => {
    setValue('input', {
      assetSlug: outputValue.assetSlug
    });
    setValue('output', {
      assetSlug: inputValue.assetSlug
    });
    dispatch(resetSwapParamsAction());
  };

  const handleInputChange = (newInputValue: SwapInputValue, useFiat?: boolean) => {
    if (newInputValue.assetSlug === outputValue.assetSlug) {
      setValue('output', {});
    }

    dispatchLoadSwapParams(newInputValue, outputValue, useFiat);
  };

  const handleOutputChange = (newOutputValue: SwapInputValue) => {
    if (newOutputValue.assetSlug === inputValue.assetSlug) {
      setValue('input', {});
    }

    dispatchLoadSwapParams(inputValue, newOutputValue);
  };

  return (
    <>
    <form id="swap-form" className="flex flex-col h-full pt-4 flex-grow flex-1" onSubmit={handleSubmit(onSubmit)}>
      {operation && (
        // TODO: Redesign
        <div className="px-4 hidden">
          <OperationStatus network={network} typeTitle={t('swapNoun')} operation={operation} />
        </div>
      )}

      <Controller
        name="input"
        control={control}
        rules={{ validate: validateInputField }}
        render={({ field: { value, onChange } }) => (
          <SwapFormInput
            inputName="input"
            label={<T id="from" />}
            network={network}
            publicKeyHash={publicKeyHash}
            className="px-4"
            value={value}
            error={errors.input?.message}
            onChange={(value, shouldUseFiat) => {
              onChange(value);
              handleInputChange(value, shouldUseFiat);
            }}
            shouldUseFiat={shouldUseFiat}
            setShouldUseFiat={setShouldUseFiat}
            testIDs={{
              input: SwapFormFromInputSelectors.assetInput,
              assetDropDownButton: SwapFormFromInputSelectors.assetDropDownButton
            }}
          />
        )}
      />

      <div className="w-full -my-2.5 flex justify-center z-1">
        <button
          className="bg-secondary-low p-1 rounded-6"
          onClick={handleToggleIconClick}
          type="button"
          {...setTestID(SwapFormSelectors.swapPlacesButton)}
        >
          <IconBase Icon={SwapIcon} className="text-secondary rotate-90" />
        </button>
      </div>

      <Controller
        name="output"
        control={control}
        rules={{ validate: validateField }}
        render={({ field: { value, onChange } }) => (
          <SwapFormInput
            readOnly
            inputName="output"
            label={<T id="toAsset" />}
            network={network}
            publicKeyHash={publicKeyHash}
            className="mb-6 px-4"
            value={value}
            error={errors.output?.message}
            onChange={value => {
              onChange(value);
              handleOutputChange(value);
            }}
            testIDs={{
              input: SwapFormToInputSelectors.assetInput,
              assetDropDownButton: SwapFormToInputSelectors.assetDropDownButton
            }}
          />
        )}
      />

      {isDefined(swapParams.data.output) && (
        <div className="mb-6">
          <SwapInfoDropdown
            showCashBack={outputAmountInUSD.gte(10)}
            swapRouteSteps={swapRouteSteps}
            inputAmount={isDefined(swapParams.data.input) ? new BigNumber(swapParams.data.input) : undefined}
            outputAmount={new BigNumber(swapParams.data.output)}
            inputAssetMetadata={inputAssetMetadata}
            outputAssetMetadata={outputAssetMetadata}
            minimumReceivedAmount={minimumReceivedAtomic}
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
      loading={isSubmitting || swapParams.isLoading}
      disabled={submitCount > 0 && !isValid}
      testID={SwapFormSelectors.swapButton}
    >
      <T id={swapParams.isLoading ? 'searchingTheBestRoute' : 'review'} />
    </StyledButton>
  </ActionsButtonsBox>
</>
  );
});
