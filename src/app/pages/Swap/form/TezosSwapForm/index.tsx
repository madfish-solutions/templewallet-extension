import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { TransferParams } from '@taquito/taquito';
import { BatchWalletOperation } from '@taquito/taquito/dist/types/wallet/batch-operation';
import BigNumber from 'bignumber.js';
import { FormProvider, useForm } from 'react-hook-form-v7';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { EXCHANGE_XTZ_RESERVE } from 'app/pages/Swap/constants';
import { BaseSwapForm } from 'app/pages/Swap/form/BaseSwapForm';
import { SwapFieldName, TezosReviewData } from 'app/pages/Swap/form/interfaces';
import { SwapFormValue, SwapInputValue } from 'app/pages/Swap/form/SwapForm.form';
import { useGetTezosSwapTransferParams } from 'app/pages/Swap/form/use-swap-params';
import { getDefaultSwapFormValues } from 'app/pages/Swap/form/utils';
import { dispatch, useSelector } from 'app/store';
import { setOnRampAssetAction } from 'app/store/settings/actions';
import { loadSwapParamsAction } from 'app/store/swap/actions';
import { useSwapParamsSelector, useSwapTokenSelector, useSwapTokensSelector } from 'app/store/swap/selectors';
import OperationStatus from 'app/templates/OperationStatus';
import { toastError, toastUniqWarning } from 'app/toaster';
import { useFormAnalytics } from 'lib/analytics';
import { fetchRoute3SwapParams } from 'lib/apis/route3/fetch-route3-swap-params';
import { TEZOS_CHAIN_ASSET_SLUG } from 'lib/apis/wert';
import { isTezAsset, TEZ_TOKEN_SLUG } from 'lib/assets';
import { KNOWN_TOKENS_SLUGS } from 'lib/assets/known-tokens';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { useTezosAssetBalance } from 'lib/balances';
import { useGetTezosAccountTokenOrGasBalanceWithDecimals } from 'lib/balances/hooks';
import { TEZ_BURN_ADDRESS } from 'lib/constants';
import { useAssetFiatCurrencyPrice } from 'lib/fiat-currency';
import { t } from 'lib/i18n';
import {
  useCategorizedTezosAssetMetadata,
  useGetCategorizedAssetMetadata,
  useTezosTokensMetadataPresenceCheck
} from 'lib/metadata';
import { useAvailableRoute3TokensSlugs } from 'lib/route3/assets';
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
  calculateOutputAmounts,
  calculateSidePaymentsFromInput,
  getRoutingFeeTransferParams,
  multiplyAtomicAmount
} from 'lib/utils/swap.utils';
import { useAccountForTezos, useTezosBlockLevel, useTezosMainnetChain } from 'temple/front';
import { getTezosToolkitWithSigner } from 'temple/front/tezos';

// Maximum number of DEXes allowed in a cashback swap route.
// This is used when performing an additional swap via the 3Route contract
// to obtain TKEY tokens for user cashback rewards.
const CASHBACK_SWAP_MAX_DEXES = 3;

interface TezosSwapFormProps {
  slippageTolerance: number;
  onReview: SyncFn<TezosReviewData>;
  onSelectAssetClick: SyncFn<SwapFieldName>;
  selectedChainAssets: { from: string | null; to: string | null };
  activeField: SwapFieldName;
  handleToggleIconClick: EmptyFn;
}

interface ChainAssetInfo {
  networkName: string;
  chainId: string;
  assetSlug: string;
}

export const TezosSwapForm: FC<TezosSwapFormProps> = ({
  slippageTolerance,
  onReview,
  onSelectAssetClick,
  selectedChainAssets,
  activeField,
  handleToggleIconClick
}) => {
  const account = useAccountForTezos();
  const network = useTezosMainnetChain();
  if (!account || !network) throw new DeadEndBoundaryError();

  const publicKeyHash = account.address;
  const tezos = getTezosToolkitWithSigner(network.rpcBaseURL, publicKeyHash);

  const { route3tokensSlugs } = useAvailableRoute3TokensSlugs();
  useTezosTokensMetadataPresenceCheck(network.rpcBaseURL, route3tokensSlugs);

  const blockLevel = useTezosBlockLevel(network.rpcBaseURL);
  const prevBlockLevelRef = useRef(blockLevel);
  const getSwapParams = useGetTezosSwapTransferParams(tezos, publicKeyHash);
  const { data: route3Tokens } = useSwapTokensSelector();
  const swapParams = useSwapParamsSelector();
  const allUsdToTokenRates = useSelector(state => state.currency.usdToTokenRates.data);
  const getTokenMetadata = useGetCategorizedAssetMetadata(TEZOS_MAINNET_CHAIN_ID);
  const prevOutputRef = useRef(swapParams.data.output);
  const getTezosBalance = useGetTezosAccountTokenOrGasBalanceWithDecimals(publicKeyHash);

  const formAnalytics = useFormAnalytics('SwapForm');

  const sourceAssetInfo = useMemo<ChainAssetInfo | null>(() => {
    if (!selectedChainAssets.from) return null;

    const [networkName, chainId, assetSlug] = parseChainAssetSlug(selectedChainAssets.from);
    return {
      networkName,
      chainId: chainId.toString(),
      assetSlug
    };
  }, [selectedChainAssets.from]);

  const targetAssetInfo = useMemo<ChainAssetInfo | null>(() => {
    if (!selectedChainAssets.to) return null;

    const [networkName, chainId, assetSlug] = parseChainAssetSlug(selectedChainAssets.to);
    return {
      networkName,
      chainId: chainId.toString(),
      assetSlug
    };
  }, [selectedChainAssets.to]);

  const defaultValues = useMemo(
    () => getDefaultSwapFormValues(sourceAssetInfo?.assetSlug, targetAssetInfo?.assetSlug),
    [sourceAssetInfo?.assetSlug, targetAssetInfo?.assetSlug]
  );

  const form = useForm<SwapFormValue>({
    defaultValues,
    mode: 'onSubmit'
  });

  const { watch, reset, setValue, formState, getValues, clearErrors } = form;

  const inputValue = watch('input');
  const outputValue = watch('output');
  const isFiatMode = watch('isFiatMode');

  const { value: inputTokenBalance = ZERO } = useTezosAssetBalance(
    inputValue.assetSlug ?? TEZ_TOKEN_SLUG,
    publicKeyHash,
    network
  );

  const { value: outputTokenBalance = ZERO } = useTezosAssetBalance(
    outputValue.assetSlug ?? TEZ_TOKEN_SLUG,
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

  useEffect(() => {
    if (isAlertVisible) {
      toastError(t('noRoutesFound'));
    }
  }, [isAlertVisible]);

  const slippageRatio = useMemo(() => getPercentageRatio(slippageTolerance ?? 0), [slippageTolerance]);

  const swapRouteSteps = useMemo(() => {
    let hopLength = 0;

    if (isLiquidityBakingParamsResponse(swapParams.data)) {
      hopLength = (swapParams.data.tzbtcHops?.length || 0) + (swapParams.data.xtzHops?.length || 0) + 1;
    } else if ('hops' in swapParams.data) {
      hopLength = swapParams.data.hops?.length || 0;
    }

    return hopLength;
  }, [swapParams]);

  const hopsAreAbsent = isLiquidityBakingParamsResponse(swapParams.data)
    ? swapParams.data.tzbtcHops.length === 0 && swapParams.data.xtzHops.length === 0
    : swapParams.data.hops.length === 0;

  const getSwapWithFeeParams = useCallback(
    (newInputValue: SwapInputValue, newOutputValue: SwapInputValue) => {
      const { assetSlug: inputAssetSlug, amount: inputAmount } = newInputValue;
      const outputAssetSlug = newOutputValue.assetSlug;
      const inputTokenExchangeRate = inputAssetSlug ? allUsdToTokenRates[inputAssetSlug] : '0';
      const inputAmountInUsd = inputAmount?.multipliedBy(inputTokenExchangeRate) ?? ZERO;

      const isInputTokenTempleToken = inputAssetSlug === KNOWN_TOKENS_SLUGS.TEMPLE;
      const isOutputTokenTempleToken = outputAssetSlug === KNOWN_TOKENS_SLUGS.TEMPLE;
      const isSwapAmountMoreThreshold = inputAmountInUsd.isGreaterThanOrEqualTo(SWAP_THRESHOLD_TO_GET_CASHBACK);

      return {
        isInputTokenTempleToken,
        isOutputTokenTempleToken,
        isSwapAmountMoreThreshold
      };
    },
    [allUsdToTokenRates]
  );

  const inputAssetPrice = useAssetFiatCurrencyPrice(inputValue.assetSlug ?? '', network.chainId);
  const outputAssetPrice = useAssetFiatCurrencyPrice(outputValue.assetSlug ?? '', network.chainId, true);

  const parseFiatValueToAssetAmount = useCallback(
    (fiatAmount: BigNumber.Value = ZERO, assetDecimals: number = 2, inputName: 'input' | 'output' = 'input') => {
      return new BigNumber(fiatAmount || '0')
        .dividedBy((inputName === 'input' ? inputAssetPrice : outputAssetPrice) ?? 1)
        .decimalPlaces(assetDecimals, BigNumber.ROUND_FLOOR);
    },
    [inputAssetPrice, outputAssetPrice]
  );

  const atomsInputValue = useMemo(() => {
    const inputValueToUse = isFiatMode
      ? parseFiatValueToAssetAmount(inputValue.amount, inputAssetMetadata.decimals)
      : inputValue.amount;

    return tokensToAtoms(inputValueToUse ?? ZERO, inputAssetMetadata.decimals);
  }, [inputAssetMetadata.decimals, inputValue.amount, isFiatMode, parseFiatValueToAssetAmount]);

  const { outputAtomicAmountBeforeFee, minimumReceivedAtomic, outputFeeAtomicAmount } = useMemo(
    () => calculateOutputAmounts(atomsInputValue, swapParams.data.output, outputAssetMetadata.decimals, slippageRatio),
    [atomsInputValue, swapParams.data.output, outputAssetMetadata.decimals, slippageRatio]
  );

  const dispatchLoadSwapParams = useCallback(
    (input: SwapInputValue, output: SwapInputValue) => {
      if (!input.assetSlug || !output.assetSlug) return;

      const inputMetadata = getTokenMetadata(input.assetSlug);

      if (!inputMetadata) return;

      const inputValueToUse = watch('isFiatMode')
        ? parseFiatValueToAssetAmount(input.amount, inputAssetMetadata.decimals)
        : input.amount;

      const { swapInputMinusFeeAtomic: amount } = calculateSidePaymentsFromInput(
        tokensToAtoms(inputValueToUse ?? ZERO, inputMetadata.decimals)
      );

      const route3FromToken = getRoute3TokenBySlug(route3Tokens, input.assetSlug);
      const route3ToToken = getRoute3TokenBySlug(route3Tokens, output.assetSlug);

      dispatch(
        loadSwapParamsAction.submit({
          fromSymbol: route3FromToken?.symbol ?? '',
          toSymbol: route3ToToken?.symbol ?? '',
          toTokenDecimals: route3ToToken?.decimals ?? 0,
          amount: atomsToTokens(amount, route3FromToken?.decimals ?? 0).toFixed(),
          rpcUrl: tezos.rpc.getRpcUrl()
        })
      );
    },
    [getTokenMetadata, inputAssetMetadata.decimals, parseFiatValueToAssetAmount, route3Tokens, tezos.rpc, watch]
  );

  useEffect(() => {
    if (isDefined(fromRoute3Token) && isDefined(toRoute3Token) && prevBlockLevelRef.current !== blockLevel) {
      dispatchLoadSwapParams(inputValue, outputValue);
    }
    prevBlockLevelRef.current = blockLevel;
  }, [blockLevel, dispatchLoadSwapParams, fromRoute3Token, inputValue, outputValue, toRoute3Token]);

  useEffect(() => {
    if (Number(swapParams.data.input) > 0 && hopsAreAbsent) {
      setIsAlertVisible(true);
    } else {
      setIsAlertVisible(false);
    }
  }, [hopsAreAbsent, swapParams.data]);

  const resetForm = useCallback(() => void reset(defaultValues), [defaultValues, reset]);

  const handleInputChange = useCallback(
    (newInputValue: SwapInputValue) => {
      const currentFormState = getValues();
      setValue('input', newInputValue);
      clearErrors('input');

      if (newInputValue.assetSlug && newInputValue.assetSlug === currentFormState.output.assetSlug) {
        setValue('output', { assetSlug: undefined, amount: undefined });
        return;
      }

      dispatchLoadSwapParams(newInputValue, currentFormState.output);
    },
    [clearErrors, dispatchLoadSwapParams, getValues, setValue]
  );

  const handleOutputChange = useCallback(
    (newOutputValue: SwapInputValue) => {
      const currentFormState = getValues();
      setValue('output', newOutputValue);
      clearErrors('output');

      if (newOutputValue.assetSlug && newOutputValue.assetSlug === currentFormState.input.assetSlug) {
        setValue('input', { assetSlug: undefined, amount: undefined });
        return;
      }

      dispatchLoadSwapParams(currentFormState.input, newOutputValue);
    },
    [clearErrors, dispatchLoadSwapParams, getValues, setValue]
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
      const { expectedReceivedAtomic } = calculateOutputAmounts(
        atomsInputValue,
        currentOutput,
        outputAssetMetadata.decimals,
        slippageRatio
      );

      const amount = atomsToTokens(expectedReceivedAtomic, outputAssetMetadata.decimals);
      setValue('output', {
        assetSlug: outputValue.assetSlug,
        amount: isFiatMode ? amount.times(outputAssetPrice).decimalPlaces(2, BigNumber.ROUND_FLOOR) : amount
      });
    }
  }, [
    atomsInputValue,
    isFiatMode,
    outputAssetMetadata.decimals,
    outputAssetPrice,
    outputValue.assetSlug,
    setValue,
    slippageRatio,
    swapParams.data.output
  ]);

  const inputTokenMaxAmount = useMemo(() => {
    if (!inputValue.assetSlug || !inputTokenBalance) return ZERO;
    if (!isTezAsset(inputValue.assetSlug)) return inputTokenBalance;

    return inputTokenBalance.lte(EXCHANGE_XTZ_RESERVE)
      ? inputTokenBalance
      : inputTokenBalance.minus(EXCHANGE_XTZ_RESERVE);
  }, [inputTokenBalance, inputValue.assetSlug]);

  const handleSetMaxAmount = useCallback(() => {
    if (inputValue.assetSlug && inputTokenMaxAmount) {
      const formattedMaxAmount = isFiatMode
        ? inputTokenMaxAmount.times(inputAssetPrice).decimalPlaces(2, BigNumber.ROUND_FLOOR)
        : inputTokenMaxAmount;

      handleInputChange({ assetSlug: inputValue.assetSlug, amount: formattedMaxAmount });

      if (isTezAsset(inputValue.assetSlug) && inputTokenBalance?.lte(EXCHANGE_XTZ_RESERVE)) {
        toastUniqWarning(t('notEnoughTezForFee'), true);
      }
    }
  }, [handleInputChange, inputAssetPrice, inputTokenBalance, inputTokenMaxAmount, inputValue.assetSlug, isFiatMode]);

  useEffect(() => {
    const newAssetSlug = activeField === 'from' ? sourceAssetInfo?.assetSlug : targetAssetInfo?.assetSlug;
    if (!newAssetSlug) return;
    const newAssetMetadata = getTokenMetadata(newAssetSlug);
    if (!newAssetMetadata) return;

    const currentFormState = getValues();
    const amount = activeField === 'from' ? currentFormState.input.amount : currentFormState.output.amount;

    activeField === 'from'
      ? handleInputChange({
          assetSlug: newAssetSlug,
          amount: amount
        })
      : handleOutputChange({
          assetSlug: newAssetSlug,
          amount: amount
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

    if (
      inputValue.assetSlug === TEZ_TOKEN_SLUG &&
      getTezosBalance(TEZOS_MAINNET_CHAIN_ID, TEZ_TOKEN_SLUG)?.lte(EXCHANGE_XTZ_RESERVE)
    ) {
      dispatch(setOnRampAssetAction(TEZOS_CHAIN_ASSET_SLUG));

      return;
    }

    const analyticsProperties = {
      inputAsset: inputAssetMetadata.symbol,
      outputAsset: outputAssetMetadata.symbol,
      inputAmount: inputValue.amount?.toString(),
      outputAmount: outputValue.amount?.toString()
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
        account,
        network,
        opParams,
        cashbackInTkey: cashback ? atomsToTokens(new BigNumber(cashback), TEMPLE_TOKEN.decimals).toString() : undefined,
        onConfirm: o => {
          resetForm();
          setOperation(o);
        },
        minimumReceived: {
          amount: atomsToTokens(new BigNumber(minimumReceivedAtomic), outputAssetMetadata.decimals).toString(),
          symbol: outputAssetMetadata.symbol
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
  }, [
    account,
    atomsInputValue,
    formAnalytics,
    formState.isSubmitting,
    fromRoute3Token,
    getSwapParams,
    getSwapWithFeeParams,
    getTezosBalance,
    inputAssetMetadata.symbol,
    inputValue,
    minimumReceivedAtomic,
    network,
    onReview,
    outputAssetMetadata.decimals,
    outputAssetMetadata.symbol,
    outputAtomicAmountBeforeFee,
    outputFeeAtomicAmount,
    outputValue,
    publicKeyHash,
    resetForm,
    slippageRatio,
    swapParams.data,
    tezos,
    toRoute3Token
  ]);

  return (
    <FormProvider {...form}>
      {operation && (
        <div className="px-4 hidden">
          <OperationStatus network={network} typeTitle={t('swapNoun')} operation={operation} />
        </div>
      )}
      <BaseSwapForm
        network={network}
        inputAssetSlug={inputValue.assetSlug}
        inputAssetSymbol={inputAssetMetadata.symbol}
        inputAssetDecimals={inputAssetMetadata.decimals}
        inputAssetPrice={inputAssetPrice}
        inputAssetBalance={inputTokenBalance}
        inputTokenAmount={inputValue.amount}
        inputAmount={isDefined(swapParams.data.input) ? new BigNumber(swapParams.data.input) : undefined}
        inputTokenMaxAmount={inputTokenMaxAmount}
        outputAssetSlug={outputValue.assetSlug}
        outputAssetSymbol={outputAssetMetadata.symbol}
        outputAssetDecimals={outputAssetMetadata.decimals}
        outputAssetPrice={outputAssetPrice}
        outputAssetBalance={outputTokenBalance}
        outputTokenAmount={outputValue.amount}
        outputAmount={isDefined(swapParams.data.output) ? new BigNumber(swapParams.data.output) : undefined}
        minimumReceivedAmount={minimumReceivedAtomic}
        swapParamsAreLoading={swapParams.isLoading}
        swapRouteSteps={swapRouteSteps}
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
