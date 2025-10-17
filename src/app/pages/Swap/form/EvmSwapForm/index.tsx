import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ChainId, Route } from '@lifi/sdk';
import { isDefined } from '@rnw-community/shared';
import BigNumber from 'bignumber.js';
import { FormProvider, useForm } from 'react-hook-form-v7';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { BaseSwapForm } from 'app/pages/Swap/form/BaseSwapForm';
import { getProtocolFeeForRouteStep } from 'app/pages/Swap/form/EvmSwapForm/utils';
import { useFetchLifiEvmTokensSlugs } from 'app/pages/Swap/form/hooks';
import { SwapFormValue, SwapInputValue } from 'app/pages/Swap/form/SwapForm.form';
import { formatDuration, getBufferedExecutionDuration, getDefaultSwapFormValues } from 'app/pages/Swap/form/utils';
import { useLifiEvmTokenMetadataSelector } from 'app/store/evm/swap-lifi-metadata/selectors';
import { useEvmTokenMetadataSelector } from 'app/store/evm/tokens-metadata/selectors';
import { toastError } from 'app/toaster';
import { useFormAnalytics } from 'lib/analytics';
import { getEvmAllSwapRoutes, getEvmSwapQuote } from 'lib/apis/temple/endpoints/evm';
import { RouteParams } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { fromAssetSlug, parseChainAssetSlug } from 'lib/assets/utils';
import { useEvmAssetBalance } from 'lib/balances/hooks';
import { EVM_ZERO_ADDRESS } from 'lib/constants';
import { useAssetFiatCurrencyPrice } from 'lib/fiat-currency';
import { t } from 'lib/i18n';
import { getAssetSymbol, useGetEvmGasOrTokenMetadata } from 'lib/metadata';
import { atomsToTokens, tokensToAtoms } from 'lib/temple/helpers';
import { useInterval } from 'lib/ui/hooks';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';
import { ZERO } from 'lib/utils/numbers';
import { useAccountForEvm } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';

import { ChainAssetInfo, EvmReviewData, SwapFieldName } from '../interfaces';

interface EvmSwapFormProps {
  chainId: number;
  slippageTolerance: number;
  onReview: SyncFn<EvmReviewData>;
  onSelectAssetClick: SyncFn<SwapFieldName>;
  selectedChainAssets: { from: string | null; to: string | null };
  activeField: SwapFieldName;
  confirmSwapModalOpened: boolean;
  handleToggleIconClick: EmptyFn;
}

const AUTO_REFRESH_INTERVAL_MS = 60000; // 60 seconds

export const EvmSwapForm: FC<EvmSwapFormProps> = ({
  chainId,
  slippageTolerance,
  onReview,
  onSelectAssetClick,
  selectedChainAssets,
  activeField,
  confirmSwapModalOpened,
  handleToggleIconClick
}) => {
  const account = useAccountForEvm();
  if (!account) throw new DeadEndBoundaryError();

  const publicKeyHash = account.address as HexString;

  const [swapRoute, setSwapRoute] = useState<Route | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const isRouteLoadingRef = useRef(false);

  const getTokenMetadata = useGetEvmGasOrTokenMetadata();

  const sourceAssetInfo = useMemo<ChainAssetInfo | null>(() => {
    if (!selectedChainAssets.from) return null;

    const [networkKind, chainId, assetSlug] = parseChainAssetSlug(selectedChainAssets.from);
    return {
      networkKind,
      chainId: Number(chainId),
      assetSlug
    };
  }, [selectedChainAssets.from]);

  const targetAssetInfo = useMemo<ChainAssetInfo | null>(() => {
    if (!selectedChainAssets.to) return null;

    const [networkKind, chainId, assetSlug] = parseChainAssetSlug(selectedChainAssets.to);
    return {
      networkKind,
      chainId: Number(chainId),
      assetSlug
    };
  }, [selectedChainAssets.to]);

  const inputNetwork = useEvmChainByChainId((sourceAssetInfo?.chainId as number) || ChainId.ETH);
  const outputNetwork = useEvmChainByChainId((targetAssetInfo?.chainId as number) || ChainId.ETH);

  const formAnalytics = useFormAnalytics(inputNetwork?.chainId !== outputNetwork?.chainId ? 'BridgeForm' : 'SwapForm');

  if (!inputNetwork || !outputNetwork) throw new DeadEndBoundaryError();

  const defaultValues = useMemo(
    () => getDefaultSwapFormValues(sourceAssetInfo, targetAssetInfo),
    [sourceAssetInfo, targetAssetInfo]
  );

  const tokenContract = useMemo(() => {
    const assetSlug = sourceAssetInfo?.assetSlug ?? targetAssetInfo?.assetSlug;

    if (!assetSlug) {
      throw new Error('Either sourceAssetInfo or targetAssetInfo must be defined');
    }

    return isEvmNativeTokenSlug(assetSlug) ? EVM_ZERO_ADDRESS : fromAssetSlug(assetSlug)[0];
  }, [sourceAssetInfo?.assetSlug, targetAssetInfo?.assetSlug]);

  useFetchLifiEvmTokensSlugs({ fromChain: chainId, fromToken: tokenContract });

  const form = useForm<SwapFormValue>({
    defaultValues,
    mode: 'onSubmit',
    reValidateMode: 'onChange'
  });

  const { watch, reset, setValue, formState, getValues, clearErrors } = form;

  const inputValue = watch('input');
  const outputValue = watch('output');
  const isFiatMode = watch('isFiatMode');

  const { value: inputTokenBalance = ZERO } = useEvmAssetBalance(
    inputValue.assetSlug ?? EVM_TOKEN_SLUG,
    publicKeyHash,
    inputNetwork
  );
  const { value: outputTokenBalance = ZERO } = useEvmAssetBalance(
    outputValue.assetSlug ?? EVM_TOKEN_SLUG,
    publicKeyHash,
    outputNetwork
  );

  const { value: sourceGasTokenBalance = ZERO } = useEvmAssetBalance(EVM_TOKEN_SLUG, publicKeyHash, inputNetwork);
  const { value: destinationGasTokenBalance = ZERO } = useEvmAssetBalance(EVM_TOKEN_SLUG, publicKeyHash, outputNetwork);

  const storedInputTokenMetadata = useEvmTokenMetadataSelector(
    (sourceAssetInfo?.chainId as number) || chainId,
    inputValue.assetSlug ?? EVM_TOKEN_SLUG
  );
  const storedOutputTokenMetadata = useEvmTokenMetadataSelector(
    (targetAssetInfo?.chainId as number) || chainId,
    outputValue.assetSlug ?? EVM_TOKEN_SLUG
  );
  const lifiInputTokenMetadata = useLifiEvmTokenMetadataSelector(
    (sourceAssetInfo?.chainId as number) || chainId,
    inputValue.assetSlug ?? EVM_TOKEN_SLUG
  );
  const lifiOutputTokenMetadata = useLifiEvmTokenMetadataSelector(
    (targetAssetInfo?.chainId as number) || chainId,
    outputValue.assetSlug ?? EVM_TOKEN_SLUG
  );

  const inputAssetMetadata = isEvmNativeTokenSlug(inputValue.assetSlug ?? EVM_TOKEN_SLUG)
    ? inputNetwork.currency
    : storedInputTokenMetadata ?? lifiInputTokenMetadata;
  const outputAssetMetadata = isEvmNativeTokenSlug(outputValue.assetSlug ?? EVM_TOKEN_SLUG)
    ? outputNetwork.currency
    : storedOutputTokenMetadata ?? lifiOutputTokenMetadata;

  const inputAssetSymbol = useMemo(() => getAssetSymbol(inputAssetMetadata), [inputAssetMetadata]);
  const outputAssetSymbol = useMemo(() => getAssetSymbol(outputAssetMetadata), [outputAssetMetadata]);

  const inputAssetPrice = useAssetFiatCurrencyPrice(inputValue.assetSlug ?? '', inputNetwork.chainId, true);
  const outputAssetPrice = useAssetFiatCurrencyPrice(outputValue.assetSlug ?? '', outputNetwork.chainId, true);

  const resetForm = useCallback(() => {
    setSwapRoute(null);
    void reset(defaultValues);
  }, [defaultValues, reset]);

  const handleInputChange = useCallback(
    (newInputValue: SwapInputValue) => {
      const currentFormState = getValues();
      setValue('input', newInputValue);
      clearErrors('input');

      if (!newInputValue.amount) {
        setValue('output', {
          assetSlug: currentFormState.output.assetSlug,
          chainId: currentFormState.output.chainId,
          amount: undefined
        });
      }

      if (
        newInputValue.assetSlug === currentFormState.output.assetSlug &&
        newInputValue.chainId === currentFormState.output.chainId
      ) {
        setValue('output', { assetSlug: undefined, chainId: undefined, amount: undefined });
        setSwapRoute(null);
        return;
      }
    },
    [clearErrors, getValues, setValue]
  );

  const handleOutputChange = useCallback(
    (newOutputValue: SwapInputValue) => {
      const currentFormState = getValues();
      setValue('output', newOutputValue);
      clearErrors('output');

      if (
        newOutputValue.assetSlug === currentFormState.input.assetSlug &&
        newOutputValue.chainId === currentFormState.input.chainId
      ) {
        setValue('input', { assetSlug: undefined, chainId: undefined, amount: undefined });
        setSwapRoute(null);
        return;
      }
    },
    [clearErrors, getValues, setValue]
  );

  const parseFiatValueToAssetAmount = useCallback(
    (
      fiatAmount: BigNumber.Value = ZERO,
      assetDecimals: number = 2,
      inputName: SwapFieldName = 'input',
      assetPriceOverride?: BigNumber.Value
    ) => {
      const price = assetPriceOverride ?? (inputName === 'input' ? inputAssetPrice : outputAssetPrice) ?? 1;

      return new BigNumber(fiatAmount || '0').dividedBy(price).decimalPlaces(assetDecimals, BigNumber.ROUND_FLOOR);
    },
    [inputAssetPrice, outputAssetPrice]
  );

  const atomsInputValue = useMemo(() => {
    const inputValueToUse = isFiatMode
      ? parseFiatValueToAssetAmount(inputValue.amount, inputAssetMetadata?.decimals)
      : inputValue.amount;

    return tokensToAtoms(inputValueToUse || ZERO, inputAssetMetadata?.decimals ?? 0);
  }, [inputAssetMetadata?.decimals, inputValue.amount, isFiatMode, parseFiatValueToAssetAmount]);

  const routeAbortControllerRef = useRef<AbortController | null>(null);

  const fetchEvmSwapRoute = useCallback(async (params: RouteParams) => {
    routeAbortControllerRef.current?.abort();
    const controller = new AbortController();
    routeAbortControllerRef.current = controller;

    try {
      const quoteResponse = await getEvmSwapQuote(params, controller.signal);

      if (quoteResponse !== undefined) {
        return quoteResponse;
      }

      const routesResponse = await getEvmAllSwapRoutes(params, controller.signal);

      if (routesResponse === undefined) {
        return undefined;
      }

      if (routesResponse.routes.length === 0) {
        return null;
      }

      // select the first route for now
      return routesResponse.routes[0];
    } catch (error: unknown) {
      if ((error as Error)?.name === 'CanceledError') return undefined;
      console.error('EVM Swap route error:', error instanceof Error ? error.message : error);
      throw error;
    }
  }, []);

  const updateSwapRoute = useCallback(
    async (params: RouteParams) => {
      if (isRouteLoadingRef.current) return;
      isRouteLoadingRef.current = true;
      setIsRouteLoading(true);
      setIsAlertVisible(false);

      try {
        const data = await fetchEvmSwapRoute(params);
        if (data) {
          setSwapRoute(data);
          setIsRouteLoading(false);
          isRouteLoadingRef.current = false;
          return data;
        }

        setSwapRoute(null);
        setIsAlertVisible(data === null);
        setIsRouteLoading(false);
        isRouteLoadingRef.current = false;
        return;
      } catch (error) {
        setSwapRoute(null);
        setIsAlertVisible(true);
        setIsRouteLoading(false);
        isRouteLoadingRef.current = false;
        throw error;
      }
    },
    [fetchEvmSwapRoute]
  );

  const buildSwapRouteParams = useCallback((): RouteParams | null => {
    if (!sourceAssetInfo || !targetAssetInfo || !inputValue.amount || new BigNumber(inputValue.amount).isZero()) {
      return null;
    }

    const fromToken = isEvmNativeTokenSlug(sourceAssetInfo.assetSlug)
      ? EVM_ZERO_ADDRESS
      : fromAssetSlug(sourceAssetInfo.assetSlug)[0];
    const toToken = isEvmNativeTokenSlug(targetAssetInfo.assetSlug)
      ? EVM_ZERO_ADDRESS
      : fromAssetSlug(targetAssetInfo.assetSlug)[0];

    return {
      fromChain: sourceAssetInfo.chainId as number,
      toChain: targetAssetInfo.chainId as number,
      fromToken,
      toToken,
      amount: atomsInputValue.toFixed(),
      fromAddress: publicKeyHash,
      slippage: slippageTolerance / 100
    };
  }, [sourceAssetInfo, targetAssetInfo, inputValue.amount, atomsInputValue, publicKeyHash, slippageTolerance]);

  const getAndSetSwapRoute = useCallback(async () => {
    const params = buildSwapRouteParams();
    if (!params) {
      setSwapRoute(null);
      return;
    }

    void updateSwapRoute(params);
  }, [buildSwapRouteParams, updateSwapRoute]);

  useEffect(() => {
    if (!inputValue.amount || new BigNumber(inputValue.amount).isLessThanOrEqualTo(0)) {
      setSwapRoute(null);
      return;
    }
    if (sourceAssetInfo?.assetSlug && targetAssetInfo?.assetSlug) {
      void getAndSetSwapRoute();
    }
  }, [
    inputValue.amount,
    sourceAssetInfo?.assetSlug,
    targetAssetInfo?.assetSlug,
    slippageTolerance,
    getAndSetSwapRoute
  ]);

  useInterval(
    () => {
      if (
        inputValue.amount &&
        new BigNumber(inputValue.amount).isGreaterThan(0) &&
        sourceAssetInfo &&
        targetAssetInfo &&
        !isRouteLoadingRef.current &&
        !formState.isSubmitting &&
        !confirmSwapModalOpened
      ) {
        getAndSetSwapRoute().catch(error => {
          console.error('Error during auto-refresh:', error);
        });
      }
    },
    [
      inputValue.amount,
      sourceAssetInfo,
      targetAssetInfo,
      formState.isSubmitting,
      confirmSwapModalOpened,
      getAndSetSwapRoute
    ],
    AUTO_REFRESH_INTERVAL_MS,
    false
  );

  useEffect(() => {
    const { isFiatMode, output } = getValues();
    if (!swapRoute) return;

    const atomicAmount = atomsToTokens(new BigNumber(swapRoute.toAmount), swapRoute.toToken.decimals);

    const formattedAmount = isFiatMode
      ? atomicAmount.times(outputAssetPrice).decimalPlaces(2, BigNumber.ROUND_FLOOR)
      : atomicAmount;

    handleOutputChange({ assetSlug: output.assetSlug, chainId: output.chainId, amount: formattedAmount });
  }, [getValues, handleOutputChange, outputAssetPrice, swapRoute]);

  const inputTokenMaxAmount = useMemo(() => {
    if (!inputValue.assetSlug || !inputTokenBalance) return ZERO;
    return inputTokenBalance;
  }, [inputTokenBalance, inputValue.assetSlug]);

  const handleSetMaxAmount = useCallback(() => {
    if (inputValue.assetSlug && inputTokenMaxAmount) {
      const formattedMaxAmount = isFiatMode
        ? inputTokenMaxAmount.times(inputAssetPrice).decimalPlaces(2, BigNumber.ROUND_FLOOR)
        : inputTokenMaxAmount;

      handleInputChange({ assetSlug: inputValue.assetSlug, chainId: inputValue.chainId, amount: formattedMaxAmount });
    }
  }, [handleInputChange, inputAssetPrice, inputTokenMaxAmount, inputValue.assetSlug, inputValue.chainId, isFiatMode]);

  const getMinimumReceivedAmount = useCallback(
    (outputAmount: BigNumber | undefined) => {
      return outputAmount ? outputAmount.minus(outputAmount.times(slippageTolerance / 100)) : ZERO;
    },
    [slippageTolerance]
  );

  useEffect(() => {
    const newAssetInfo = activeField === 'input' ? sourceAssetInfo : targetAssetInfo;
    if (!newAssetInfo) return;
    const newAssetMetadata = getTokenMetadata(newAssetInfo.chainId as number, newAssetInfo.assetSlug);
    if (!newAssetMetadata) return;

    const currentFormState = getValues();
    const amount = activeField === 'input' ? currentFormState.input.amount : currentFormState.output.amount;

    activeField === 'input'
      ? handleInputChange({
          assetSlug: newAssetInfo.assetSlug,
          chainId: newAssetInfo.chainId,
          amount: amount
        })
      : handleOutputChange({
          assetSlug: newAssetInfo.assetSlug,
          chainId: newAssetInfo.chainId,
          amount: amount
        });
  }, [
    activeField,
    getTokenMetadata,
    getValues,
    handleInputChange,
    handleOutputChange,
    isFiatMode,
    sourceAssetInfo,
    targetAssetInfo
  ]);

  const onSubmit = useCallback(async () => {
    if (formState.isSubmitting) return;
    if (!inputValue.assetSlug || !outputValue.assetSlug) return;

    if (!swapRoute) {
      setIsAlertVisible(true);
      return;
    }

    const currentFormState = getValues();

    const analyticsProperties = {
      inputAsset: `${inputAssetMetadata?.symbol}-${sourceAssetInfo?.chainId}`,
      outputAsset: `${outputAssetMetadata?.symbol}-${targetAssetInfo?.chainId}`,
      inputAmount: currentFormState.input.amount?.toString(),
      outputAmount: currentFormState.output.amount?.toString(),
      networkFrom: inputNetwork.name,
      networkTo: outputNetwork.name
    };

    try {
      formAnalytics.trackSubmit(analyticsProperties);

      onReview({
        account,
        network: inputNetwork,
        handleResetForm: resetForm,
        swapRoute: swapRoute
      });

      formAnalytics.trackSubmitSuccess(analyticsProperties);
    } catch (err: any) {
      console.error(err);
      toastError(err.message);
      formAnalytics.trackSubmitFail(analyticsProperties);
    }
  }, [
    account,
    formAnalytics,
    formState.isSubmitting,
    getValues,
    inputAssetMetadata?.symbol,
    inputNetwork,
    inputValue.assetSlug,
    onReview,
    outputAssetMetadata?.symbol,
    outputNetwork.name,
    outputValue.assetSlug,
    resetForm,
    sourceAssetInfo?.chainId,
    swapRoute,
    targetAssetInfo?.chainId
  ]);

  useEffect(() => {
    if (isAlertVisible) {
      toastError(t('noRoutesFound'));
    }
  }, [isAlertVisible]);

  const shownInsufficientNetworksRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!swapRoute) {
      shownInsufficientNetworksRef.current.clear();
      return;
    }

    const isBridge = inputNetwork.chainId !== outputNetwork.chainId;
    if (!isBridge) {
      shownInsufficientNetworksRef.current.clear();
      return;
    }

    const insufficientNetworks: string[] = [];
    if (sourceGasTokenBalance.lte(0)) insufficientNetworks.push(inputNetwork.name);
    if (destinationGasTokenBalance.lte(0)) insufficientNetworks.push(outputNetwork.name);

    if (insufficientNetworks.length === 0) {
      shownInsufficientNetworksRef.current.clear();
      return;
    }

    for (const networkName of insufficientNetworks) {
      if (!shownInsufficientNetworksRef.current.has(networkName)) {
        toastError(`Insufficient gas balance on ${networkName}`);
        shownInsufficientNetworksRef.current.add(networkName);
      }
    }
  }, [
    swapRoute,
    inputNetwork.chainId,
    inputNetwork.name,
    outputNetwork.chainId,
    outputNetwork.name,
    sourceGasTokenBalance,
    destinationGasTokenBalance
  ]);

  const estimatedTokensFromAmount = useMemo(
    () =>
      isDefined(swapRoute?.fromAmount)
        ? atomsToTokens(new BigNumber(+swapRoute.fromAmount), inputAssetMetadata?.decimals ?? 0)
        : undefined,
    [inputAssetMetadata?.decimals, swapRoute?.fromAmount]
  );

  const estimatedTokensToAmount = useMemo(
    () =>
      isDefined(swapRoute?.toAmount)
        ? atomsToTokens(new BigNumber(+swapRoute.toAmount), outputAssetMetadata?.decimals ?? 0)
        : undefined,
    [outputAssetMetadata?.decimals, swapRoute?.toAmount]
  );

  const priceImpact = useMemo(() => {
    const fromAmountUSD = swapRoute?.fromAmountUSD;
    const toAmountUSD = swapRoute?.toAmountUSD;

    if (fromAmountUSD !== undefined && toAmountUSD !== undefined) {
      const from = new BigNumber(fromAmountUSD);
      const to = new BigNumber(toAmountUSD);

      if (from.isZero()) return 0;

      return from.minus(to).dividedBy(from).toNumber();
    }

    return 0;
  }, [swapRoute?.fromAmountUSD, swapRoute?.toAmountUSD]);

  const bridgeDetails = useMemo(() => {
    if (inputNetwork.chainId === outputNetwork.chainId || !swapRoute) return;

    return {
      tools: swapRoute.steps.map(step => step.toolDetails),
      executionTime: formatDuration(
        swapRoute.steps
          .map(step => getBufferedExecutionDuration(step?.estimate?.executionDuration))
          .reduce((sum, seconds) => sum + seconds, 0)
      ),
      priceImpact,
      protocolFee: getProtocolFeeForRouteStep(swapRoute.steps[0], inputNetwork),
      gasTokenSymbol: inputNetwork.currency.symbol
    };
  }, [inputNetwork, outputNetwork.chainId, priceImpact, swapRoute]);

  return (
    <FormProvider {...form}>
      <BaseSwapForm
        isEvmNetwork
        inputAssetSlug={inputValue.assetSlug}
        inputAssetSymbol={inputAssetSymbol}
        inputAssetDecimals={inputAssetMetadata?.decimals ?? 0}
        inputAssetPrice={inputAssetPrice}
        inputAssetBalance={inputTokenBalance}
        inputTokenAmount={inputValue.amount}
        inputAmount={estimatedTokensFromAmount}
        inputChainId={inputValue.chainId}
        inputTokenMaxAmount={inputTokenMaxAmount}
        outputAssetSlug={outputValue.assetSlug}
        outputAssetSymbol={outputAssetSymbol}
        outputAssetDecimals={outputAssetMetadata?.decimals ?? 0}
        outputAssetPrice={outputAssetPrice}
        outputAssetBalance={outputTokenBalance}
        outputTokenAmount={outputValue.amount}
        outputAmount={estimatedTokensToAmount}
        outputChainId={outputValue.chainId}
        minimumReceivedAmount={tokensToAtoms(
          getMinimumReceivedAmount(outputValue.amount),
          outputAssetMetadata?.decimals ?? 0
        )}
        swapParamsAreLoading={isRouteLoading}
        swapRouteSteps={swapRoute?.steps.length ?? 1}
        bridgeDetails={bridgeDetails}
        setIsFiatMode={v => setValue('isFiatMode', v)}
        parseFiatValueToAssetAmount={parseFiatValueToAssetAmount}
        onInputChange={handleInputChange}
        onOutputChange={handleOutputChange}
        onSelectAssetClick={onSelectAssetClick}
        handleSetMaxAmount={handleSetMaxAmount}
        handleToggleIconClick={() => {
          handleToggleIconClick();
          setSwapRoute(null);
        }}
        onSubmit={onSubmit}
      />
    </FormProvider>
  );
};
