import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ChainId, Route } from '@lifi/sdk';
import { isDefined } from '@rnw-community/shared';
import BigNumber from 'bignumber.js';
import { FormProvider, useForm } from 'react-hook-form-v7';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { THRESHOLD_FOR_PROTOCOL_FEE } from 'app/pages/Swap/constants';
import { BaseSwapForm } from 'app/pages/Swap/form/BaseSwapForm';
import { useFetchLifiEvmTokensSlugs } from 'app/pages/Swap/form/hooks';
import { SwapFormValue, SwapInputValue } from 'app/pages/Swap/form/SwapForm.form';
import { formatDuration, getBufferedExecutionDuration, getDefaultSwapFormValues } from 'app/pages/Swap/form/utils';
import { useLifiEvmTokenMetadataSelector } from 'app/store/evm/swap-lifi-metadata/selectors';
import { useEvmTokenMetadataSelector } from 'app/store/evm/tokens-metadata/selectors';
import { toastError } from 'app/toaster';
import { erc20AllowanceAbi } from 'lib/abi/erc20';
import { useFormAnalytics } from 'lib/analytics';
import { getEvmBestSwapRoute } from 'lib/apis/temple/endpoints/evm';
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
import { toBigInt, ZERO } from 'lib/utils/numbers';
import { getViemPublicClient } from 'temple/evm';
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
  handleToggleIconClick: EmptyFn;
}

const AUTO_REFRESH_INTERVAL_MS = 30000; // 30 seconds

export const EvmSwapForm: FC<EvmSwapFormProps> = ({
  chainId,
  slippageTolerance,
  onReview,
  onSelectAssetClick,
  selectedChainAssets,
  activeField,
  handleToggleIconClick
}) => {
  const account = useAccountForEvm();
  if (!account) throw new DeadEndBoundaryError();

  const publicKeyHash = account.address as HexString;

  const [swapRoute, setSwapRoute] = useState<Route | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const lifiStep = useMemo(
    () => (swapRoute?.steps?.[0]?.type === 'lifi' ? swapRoute?.steps[0] : undefined),
    [swapRoute]
  );

  const [isAlertVisible, setIsAlertVisible] = useState(false);

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

    setIsAlertVisible(false);
    setIsRouteLoading(true);

    try {
      const data = await getEvmBestSwapRoute(params, controller.signal);
      if (data === undefined) {
        return;
      }
      setSwapRoute(data);
      setIsRouteLoading(false);
      return data;
    } catch (error: unknown) {
      if ((error as Error)?.name === 'CanceledError') return;
      console.error('EVM Swap route error:', error instanceof Error ? error.message : error);

      setSwapRoute(null);
      setIsRouteLoading(false);
      setIsAlertVisible(true);

      throw error;
    }
  }, []);

  const updateSwapRoute = useCallback(async () => {
    if (!sourceAssetInfo || !targetAssetInfo || !inputValue.amount || new BigNumber(inputValue.amount).isZero()) {
      setSwapRoute(null);
      return;
    }

    const fromToken = isEvmNativeTokenSlug(sourceAssetInfo.assetSlug)
      ? EVM_ZERO_ADDRESS
      : fromAssetSlug(sourceAssetInfo.assetSlug)[0];
    const toToken = isEvmNativeTokenSlug(targetAssetInfo.assetSlug)
      ? EVM_ZERO_ADDRESS
      : fromAssetSlug(targetAssetInfo.assetSlug)[0];

    const params: RouteParams = {
      fromChain: sourceAssetInfo.chainId as number,
      toChain: targetAssetInfo.chainId as number,
      fromToken,
      toToken,
      amount: atomsInputValue.toFixed(),
      amountForGas: undefined,
      fromAddress: publicKeyHash,
      slippage: slippageTolerance / 100
    };

    return fetchEvmSwapRoute(params);
  }, [
    atomsInputValue,
    fetchEvmSwapRoute,
    inputValue.amount,
    publicKeyHash,
    slippageTolerance,
    sourceAssetInfo,
    targetAssetInfo
  ]);

  useEffect(() => {
    void updateSwapRoute();
  }, [updateSwapRoute]);

  useInterval(
    () => {
      if (
        inputValue.amount &&
        new BigNumber(inputValue.amount).isGreaterThan(0) &&
        sourceAssetInfo &&
        targetAssetInfo &&
        !isRouteLoading &&
        !formState.isSubmitting
      ) {
        updateSwapRoute().catch(error => {
          console.error('Error during auto-refresh:', error);
        });
      }
    },
    [inputValue.amount, sourceAssetInfo, targetAssetInfo, isRouteLoading, formState.isSubmitting, updateSwapRoute],
    AUTO_REFRESH_INTERVAL_MS,
    false
  );

  useEffect(() => {
    if (swapRoute && outputValue.assetSlug) {
      const atomicAmount = atomsToTokens(new BigNumber(swapRoute.toAmount), outputAssetMetadata?.decimals ?? 0);
      const { isFiatMode } = getValues();
      const formattedAmount = isFiatMode
        ? atomicAmount.times(outputAssetPrice).decimalPlaces(2, BigNumber.ROUND_FLOOR)
        : atomicAmount;

      handleOutputChange({ assetSlug: outputValue.assetSlug, chainId: outputValue.chainId, amount: formattedAmount });
    }
  }, [
    swapRoute,
    outputValue.assetSlug,
    outputAssetMetadata?.decimals,
    outputAssetPrice,
    isFiatMode,
    handleOutputChange,
    getValues,
    outputValue.chainId
  ]);

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

  const evmToolkit = useMemo(() => getViemPublicClient(inputNetwork), [inputNetwork]);

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

  const protocolFee = useMemo(() => {
    if (!lifiStep?.estimate?.feeCosts || !lifiStep?.estimate?.fromAmountUSD || !lifiStep?.estimate?.toAmountUSD) return;

    const fromAmountUSD = BigNumber(Number(lifiStep.estimate.fromAmountUSD));
    const toAmountUSD = BigNumber(Number(lifiStep.estimate.toAmountUSD));

    const inputOutputMarginUSD = fromAmountUSD.minus(toAmountUSD);

    const totalFeesUSD = lifiStep.estimate.feeCosts
      .map(fee => BigNumber(fee.amountUSD))
      .reduce((a, b) => a.plus(b), ZERO);

    if (inputOutputMarginUSD.minus(totalFeesUSD).isGreaterThanOrEqualTo(ZERO)) {
      return undefined;
    }

    const protocolFeesRawUSD = lifiStep.estimate.feeCosts
      .slice(1)
      .map(fee => BigNumber(fee.amountUSD))
      .reduce((a, b) => a.plus(b), ZERO);

    if (protocolFeesRawUSD.lte(THRESHOLD_FOR_PROTOCOL_FEE)) {
      return undefined;
    }

    const protocolFeesRaw = lifiStep.estimate.feeCosts
      .slice(1)
      .map(fee => BigNumber(fee.amount))
      .reduce((a, b) => a.plus(b), ZERO);

    return atomsToTokens(protocolFeesRaw, inputNetwork?.currency.decimals ?? 0).toFixed();
  }, [inputNetwork?.currency.decimals, lifiStep]);

  const onSubmit = useCallback(async () => {
    if (formState.isSubmitting) return;
    if (!inputValue.assetSlug || !outputValue.assetSlug) return;

    if (!lifiStep) {
      setIsAlertVisible(true);
      return;
    }

    let allowanceSufficient = true;
    let onChainAllowance = toBigInt(ZERO);

    if (EVM_ZERO_ADDRESS !== lifiStep.action.fromToken.address) {
      const requiredAllowance = BigInt(lifiStep.action.fromAmount);

      onChainAllowance = await evmToolkit.readContract({
        address: lifiStep.action.fromToken.address as HexString,
        abi: [erc20AllowanceAbi],
        functionName: 'allowance',
        args: [lifiStep.action.fromAddress as HexString, lifiStep.estimate.approvalAddress as HexString]
      });

      allowanceSufficient = onChainAllowance >= requiredAllowance;
    }

    const currentFormState = getValues();

    const analyticsProperties = {
      inputAsset: `${inputAssetMetadata?.symbol}-${sourceAssetInfo?.chainId}`,
      outputAsset: `${outputAssetMetadata?.symbol}-${targetAssetInfo?.chainId}`,
      inputAmount: currentFormState.input.amount?.toString(),
      outputAmount: currentFormState.output.amount?.toString()
    };

    try {
      formAnalytics.trackSubmit(analyticsProperties);

      onReview({
        account,
        network: inputNetwork,
        needsApproval: !allowanceSufficient,
        neededApproval: !allowanceSufficient,
        onChainAllowance,
        onConfirm: resetForm,
        minimumReceived: {
          amount: getMinimumReceivedAmount(outputValue.amount).toString(),
          symbol: outputAssetSymbol
        },
        lifiStep,
        bridgeInfo: {
          protocolFee,
          inputNetwork,
          outputNetwork
        }
      });

      formAnalytics.trackSubmitSuccess(analyticsProperties);
    } catch (err: any) {
      console.error(err);
      toastError(err.message);
      formAnalytics.trackSubmitFail(analyticsProperties);
    }
  }, [
    formState.isSubmitting,
    inputValue.assetSlug,
    outputValue.assetSlug,
    outputValue.amount,
    lifiStep,
    getValues,
    inputAssetMetadata?.symbol,
    sourceAssetInfo?.chainId,
    outputAssetMetadata?.symbol,
    targetAssetInfo?.chainId,
    evmToolkit,
    formAnalytics,
    onReview,
    account,
    inputNetwork,
    resetForm,
    getMinimumReceivedAmount,
    outputAssetSymbol,
    protocolFee,
    outputNetwork
  ]);

  useEffect(() => {
    if (isAlertVisible) {
      toastError(t('noRoutesFound'));
    }
  }, [isAlertVisible]);

  const estimatedTokensFromAmount = useMemo(
    () =>
      isDefined(lifiStep?.estimate.fromAmount)
        ? atomsToTokens(new BigNumber(+lifiStep.estimate.fromAmount), inputAssetMetadata?.decimals ?? 0)
        : undefined,
    [lifiStep, inputAssetMetadata?.decimals]
  );

  const estimatedTokensToAmount = useMemo(
    () =>
      isDefined(lifiStep?.estimate.toAmount)
        ? atomsToTokens(new BigNumber(+lifiStep.estimate.toAmount), outputAssetMetadata?.decimals ?? 0)
        : undefined,
    [lifiStep, outputAssetMetadata?.decimals]
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
        swapRouteSteps={lifiStep?.includedSteps.length ?? 0}
        bridgeDetails={
          inputNetwork.chainId !== outputNetwork.chainId
            ? {
                tool: lifiStep?.toolDetails,
                executionTime: formatDuration(getBufferedExecutionDuration(lifiStep?.estimate?.executionDuration)),
                priceImpact,
                protocolFee,
                gasTokenSymbol: inputNetwork.currency.symbol
              }
            : undefined
        }
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
