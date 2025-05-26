import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Route } from '@lifi/sdk';
import { isDefined } from '@rnw-community/shared';
import BigNumber from 'bignumber.js';
import { debounce } from 'lodash';
import { FormProvider, useForm } from 'react-hook-form-v7';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { BaseSwapForm } from 'app/pages/Swap/form/BaseSwapForm';
import { SwapFormValue, SwapInputValue } from 'app/pages/Swap/form/SwapForm.form';
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
import { getAssetSymbol, useGetEvmChainAssetMetadata } from 'lib/metadata';
import { atomsToTokens, tokensToAtoms } from 'lib/temple/helpers';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';
import { toBigInt, ZERO } from 'lib/utils/numbers';
import { getReadOnlyEvmForNetwork } from 'temple/evm';
import { useAccountForEvm } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';

import { EvmReviewData } from '../interfaces';

interface ChainAssetInfo {
  networkName: string;
  chainId: number;
  assetSlug: string;
}

interface EvmSwapFormProps {
  chainId: number;
  slippageTolerance: number;
  onReview: SyncFn<EvmReviewData>;
  onSelectAssetClick: (field: 'from' | 'to') => void;
  selectedChainAssets: { from: string | null; to: string | null };
  activeField: 'from' | 'to';
  handleToggleIconClick: EmptyFn;
}

const DEBOUNCE_RATE_MS = 200;
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
  const network = useEvmChainByChainId(chainId);
  if (!account || !network) throw new DeadEndBoundaryError();

  const publicKeyHash = account.address as HexString;

  const [swapRoute, setSwapRoute] = useState<Route | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const lifiStep = useMemo(
    () => (swapRoute?.steps?.[0]?.type === 'lifi' ? swapRoute?.steps[0] : undefined),
    [swapRoute]
  );

  const [isAlertVisible, setIsAlertVisible] = useState(false);

  const getTokenMetadata = useGetEvmChainAssetMetadata(chainId);
  const formAnalytics = useFormAnalytics('SwapForm');

  const sourceAssetInfo = useMemo<ChainAssetInfo | null>(() => {
    if (!selectedChainAssets.from) return null;

    const [networkName, chainId, assetSlug] = parseChainAssetSlug(selectedChainAssets.from);
    return {
      networkName,
      chainId: Number(chainId),
      assetSlug
    };
  }, [selectedChainAssets.from]);

  const targetAssetInfo = useMemo<ChainAssetInfo | null>(() => {
    if (!selectedChainAssets.to) return null;

    const [networkName, chainId, assetSlug] = parseChainAssetSlug(selectedChainAssets.to);
    return {
      networkName,
      chainId: Number(chainId),
      assetSlug
    };
  }, [selectedChainAssets.to]);

  const defaultValues = useMemo(() => {
    return {
      input: {
        assetSlug: sourceAssetInfo?.assetSlug
      },
      output: {
        assetSlug: targetAssetInfo?.assetSlug
      },
      isFiatMode: false
    };
  }, [sourceAssetInfo, targetAssetInfo]);

  const form = useForm<SwapFormValue>({
    defaultValues,
    mode: 'onSubmit',
    reValidateMode: 'onChange'
  });

  const { watch, reset, setValue, formState, getValues } = form;

  const inputValue = watch('input');
  const outputValue = watch('output');
  const isFiatMode = watch('isFiatMode');

  const { value: inputTokenBalance = ZERO } = useEvmAssetBalance(
    inputValue.assetSlug ?? EVM_TOKEN_SLUG,
    publicKeyHash,
    network
  );
  const { value: outputTokenBalance = ZERO } = useEvmAssetBalance(
    outputValue.assetSlug ?? EVM_TOKEN_SLUG,
    publicKeyHash,
    network
  );

  const storedInputTokenMetadata = useEvmTokenMetadataSelector(chainId, inputValue.assetSlug ?? EVM_TOKEN_SLUG);
  const storedOutputTokenMetadata = useEvmTokenMetadataSelector(chainId, outputValue.assetSlug ?? EVM_TOKEN_SLUG);
  const lifiInputTokenMetadata = useLifiEvmTokenMetadataSelector(chainId, inputValue.assetSlug ?? EVM_TOKEN_SLUG);
  const lifiOutputTokenMetadata = useLifiEvmTokenMetadataSelector(chainId, outputValue.assetSlug ?? EVM_TOKEN_SLUG);

  const inputAssetMetadata = isEvmNativeTokenSlug(inputValue.assetSlug ?? EVM_TOKEN_SLUG)
    ? network.currency
    : storedInputTokenMetadata ?? lifiInputTokenMetadata;
  const outputAssetMetadata = isEvmNativeTokenSlug(outputValue.assetSlug ?? EVM_TOKEN_SLUG)
    ? network.currency
    : storedOutputTokenMetadata ?? lifiOutputTokenMetadata;

  const inputAssetSymbol = useMemo(() => getAssetSymbol(inputAssetMetadata), [inputAssetMetadata]);
  const outputAssetSymbol = useMemo(() => getAssetSymbol(outputAssetMetadata), [outputAssetMetadata]);

  const inputAssetPrice = useAssetFiatCurrencyPrice(inputValue.assetSlug ?? '', network.chainId, true);

  const resetForm = useCallback(() => void reset(defaultValues), [defaultValues, reset]);

  const handleInputChange = useCallback(
    (newInputValue: SwapInputValue) => {
      const currentFormState = getValues();
      setValue('input', newInputValue);

      if (
        newInputValue.assetSlug &&
        (newInputValue.assetSlug === currentFormState.output.assetSlug ||
          sourceAssetInfo?.chainId !== targetAssetInfo?.chainId)
      ) {
        setValue('output', { assetSlug: undefined, amount: undefined });
        setSwapRoute(null);
        return;
      }
    },
    [getValues, setValue, sourceAssetInfo?.chainId, targetAssetInfo?.chainId]
  );

  const handleOutputChange = useCallback(
    (newOutputValue: SwapInputValue) => {
      const currentFormState = getValues();
      setValue('output', newOutputValue);

      if (
        newOutputValue.assetSlug &&
        (newOutputValue.assetSlug === currentFormState.input.assetSlug ||
          sourceAssetInfo?.chainId !== targetAssetInfo?.chainId)
      ) {
        setValue('input', { assetSlug: undefined, amount: undefined });
        setSwapRoute(null);
        return;
      }
    },
    [getValues, setValue, sourceAssetInfo?.chainId, targetAssetInfo?.chainId]
  );

  const parseFiatValueToAssetAmount = useCallback(
    (fiatAmount: BigNumber.Value = ZERO, assetDecimals: number = 2) => {
      return new BigNumber(fiatAmount || '0')
        .dividedBy(inputAssetPrice ?? 1)
        .decimalPlaces(assetDecimals, BigNumber.ROUND_FLOOR);
    },
    [inputAssetPrice]
  );

  const atomsInputValue = useMemo(() => {
    const inputValueToUse = isFiatMode
      ? parseFiatValueToAssetAmount(inputValue.amount, inputAssetMetadata?.decimals)
      : inputValue.amount;

    return tokensToAtoms(inputValueToUse || ZERO, inputAssetMetadata?.decimals ?? 0);
  }, [inputAssetMetadata?.decimals, inputValue.amount, isFiatMode, parseFiatValueToAssetAmount]);

  const fetchEvmSwapRoute = useCallback(async (params: RouteParams, isAutoRefresh = false) => {
    if (!isAutoRefresh) setIsRouteLoading(true);
    setIsAlertVisible(false);
    try {
      const data = await getEvmBestSwapRoute(params);
      setSwapRoute(data);
      return data;
    } catch (error: unknown) {
      console.error('EVM Swap route error:', error instanceof Error ? error.message : error);
      setSwapRoute(null);
      if (!isAutoRefresh) setIsAlertVisible(true);
      throw error;
    } finally {
      if (!isAutoRefresh) setIsRouteLoading(false);
    }
  }, []);

  const getAndSetSwapRoute = useCallback(
    async (isAutoRefresh = false) => {
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
        fromChain: sourceAssetInfo.chainId,
        toChain: targetAssetInfo.chainId,
        fromToken,
        toToken,
        amount: atomsInputValue.toString(),
        fromAddress: publicKeyHash,
        slippage: slippageTolerance / 100
      };

      return fetchEvmSwapRoute(params, isAutoRefresh);
    },
    [
      sourceAssetInfo,
      targetAssetInfo,
      inputValue.amount,
      atomsInputValue,
      publicKeyHash,
      slippageTolerance,
      fetchEvmSwapRoute
    ]
  );

  const debouncedGetAndSetSwapRouteRef = useRef<((isAutoRefresh?: boolean) => void) | null>(null);

  useEffect(() => {
    const debouncedFn = debounce((isAutoRefresh: boolean = false) => {
      getAndSetSwapRoute(isAutoRefresh);
    }, DEBOUNCE_RATE_MS);

    debouncedGetAndSetSwapRouteRef.current = debouncedFn;

    return () => {
      debouncedFn.cancel();
    };
  }, [getAndSetSwapRoute]);

  // Effect for input amount changes and asset changes
  useEffect(() => {
    if (!inputValue.amount || new BigNumber(inputValue.amount).isLessThanOrEqualTo(0)) {
      setSwapRoute(null);
      return;
    }
    if (sourceAssetInfo && targetAssetInfo) {
      debouncedGetAndSetSwapRouteRef.current?.();
    }
  }, [inputValue.amount, sourceAssetInfo, targetAssetInfo]);

  // Effect for periodic auto-refresh
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (
        inputValue.amount &&
        new BigNumber(inputValue.amount).isGreaterThan(0) &&
        sourceAssetInfo &&
        targetAssetInfo &&
        !isRouteLoading &&
        !formState.isSubmitting
      ) {
        console.log('Auto-refreshing swap route...');
        getAndSetSwapRoute(true).catch(error => {
          console.error('Error during auto-refresh:', error);
        });
      }
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [inputValue.amount, sourceAssetInfo, targetAssetInfo, getAndSetSwapRoute, isRouteLoading, formState.isSubmitting]);

  useEffect(() => {
    if (swapRoute && outputValue.assetSlug) {
      const atomicAmount = atomsToTokens(new BigNumber(swapRoute.toAmount), outputAssetMetadata?.decimals ?? 0);
      handleOutputChange({ assetSlug: outputValue.assetSlug, amount: atomicAmount });
    }
  }, [handleOutputChange, outputAssetMetadata?.decimals, outputValue.assetSlug, swapRoute]);

  const inputTokenMaxAmount = useMemo(() => {
    if (!inputValue.assetSlug || !inputTokenBalance) return ZERO;
    return inputTokenBalance;
  }, [inputTokenBalance, inputValue.assetSlug]);

  const handleSetMaxAmount = useCallback(() => {
    if (inputValue.assetSlug && inputTokenMaxAmount) {
      const formattedMaxAmount = isFiatMode
        ? inputTokenMaxAmount.times(inputAssetPrice).decimalPlaces(2, BigNumber.ROUND_FLOOR)
        : inputTokenMaxAmount;

      handleInputChange({ assetSlug: inputValue.assetSlug, amount: formattedMaxAmount });
    }
  }, [handleInputChange, inputAssetPrice, inputTokenMaxAmount, inputValue.assetSlug, isFiatMode]);

  const evmToolkit = useMemo(() => getReadOnlyEvmForNetwork(network), [network]);

  useEffect(() => {
    const newAssetSlug = activeField === 'from' ? sourceAssetInfo?.assetSlug : targetAssetInfo?.assetSlug;
    if (!newAssetSlug) return;
    const newAssetMetadata = getTokenMetadata(newAssetSlug);
    if (!newAssetMetadata) return;

    const currentFormState = getValues();
    const amount = activeField === 'from' ? currentFormState.input.amount : currentFormState.output.amount;
    const newAmount = isFiatMode
      ? amount
      : amount?.decimalPlaces(newAssetMetadata?.decimals ?? 0, BigNumber.ROUND_DOWN);

    activeField === 'from'
      ? handleInputChange({
          assetSlug: newAssetSlug,
          amount: newAmount
        })
      : handleOutputChange({
          assetSlug: newAssetSlug,
          amount: newAmount
        });
  }, [
    activeField,
    getTokenMetadata,
    getValues,
    handleInputChange,
    handleOutputChange,
    isFiatMode,
    sourceAssetInfo?.assetSlug,
    targetAssetInfo?.assetSlug
  ]);

  const onSubmit = useCallback(async () => {
    if (formState.isSubmitting) return;
    if (!swapRoute || !lifiStep || !inputValue.assetSlug || !outputValue.assetSlug) return;

    let latestRoute: Route | undefined;
    try {
      latestRoute = await getAndSetSwapRoute(false);
      if (!latestRoute) {
        setIsAlertVisible(true);
        return;
      }
    } catch (error) {
      console.error('Error refetching route on submit:', error);
      return;
    }

    const finalLifiStep = latestRoute?.steps?.[0]?.type === 'lifi' ? latestRoute?.steps[0] : undefined;

    if (!finalLifiStep) {
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
      inputAsset: currentFormState.input.assetSlug,
      outputAsset: currentFormState.output.assetSlug
    };

    try {
      formAnalytics.trackSubmit(analyticsProperties);

      onReview({
        account,
        network,
        needsApproval: !allowanceSufficient,
        neededApproval: !allowanceSufficient,
        onChainAllowance,
        onConfirm: resetForm,
        minimumReceived: {
          amount: atomsToTokens(new BigNumber(swapRoute.toAmountMin), outputAssetMetadata?.decimals ?? 0).toString(),
          symbol: outputAssetSymbol
        },
        lifiStep: lifiStep
      });

      formAnalytics.trackSubmitSuccess(analyticsProperties);
    } catch (err: any) {
      console.error(err);
      toastError(err.message);
      formAnalytics.trackSubmitFail(analyticsProperties);
    }
  }, [
    account,
    evmToolkit,
    formAnalytics,
    formState.isSubmitting,
    getValues,
    inputValue.assetSlug,
    lifiStep,
    network,
    onReview,
    outputAssetMetadata?.decimals,
    getAndSetSwapRoute,
    outputAssetSymbol,
    outputValue.assetSlug,
    resetForm,
    swapRoute
  ]);

  useEffect(() => {
    if (isAlertVisible) {
      toastError(t('noRoutesFound'));
    }
  }, [isAlertVisible]);

  const estimatedTokensFromAmount = useMemo(
    () =>
      isDefined(lifiStep?.estimate.fromAmount)
        ? atomsToTokens(BigNumber(+lifiStep.estimate.fromAmount), inputAssetMetadata?.decimals ?? 0)
        : undefined,
    [lifiStep, inputAssetMetadata?.decimals]
  );

  const estimatedTokensToAmount = useMemo(
    () =>
      isDefined(lifiStep?.estimate.toAmount)
        ? atomsToTokens(BigNumber(+lifiStep.estimate.toAmount), outputAssetMetadata?.decimals ?? 0)
        : undefined,
    [lifiStep, outputAssetMetadata?.decimals]
  );

  return (
    <FormProvider {...form}>
      <BaseSwapForm
        network={network}
        inputAssetSlug={inputValue.assetSlug}
        inputAssetSymbol={inputAssetSymbol}
        inputAssetDecimals={inputAssetMetadata?.decimals ?? 0}
        inputAssetPrice={inputAssetPrice}
        inputAssetBalance={inputTokenBalance}
        inputTokenAmount={inputValue.amount}
        inputAmount={estimatedTokensFromAmount}
        inputTokenMaxAmount={inputTokenMaxAmount}
        outputAssetSlug={outputValue.assetSlug}
        outputAssetSymbol={outputAssetSymbol}
        outputAssetDecimals={outputAssetMetadata?.decimals ?? 0}
        outputAssetBalance={outputTokenBalance}
        outputAmount={estimatedTokensToAmount}
        minimumReceivedAmount={BigNumber(swapRoute?.toAmountMin || 0)}
        swapParamsAreLoading={isRouteLoading}
        swapRouteSteps={lifiStep?.includedSteps.length ?? 0}
        setIsFiatMode={v => setValue('isFiatMode', v)}
        parseFiatValueToAssetAmount={parseFiatValueToAssetAmount}
        onInputChange={handleInputChange}
        onOutputChange={handleOutputChange}
        onSelectAssetClick={onSelectAssetClick}
        handleSetMaxAmount={handleSetMaxAmount}
        handleToggleIconClick={handleToggleIconClick}
        onSubmit={onSubmit}
      />
    </FormProvider>
  );
};
