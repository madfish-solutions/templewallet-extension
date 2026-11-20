import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { BatchWalletOperation } from '@taquito/taquito/dist/types/wallet/batch-operation';
import BigNumber from 'bignumber.js';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { EXCHANGE_XTZ_RESERVE } from 'app/pages/Swap/constants';
import { useSwapFormControl } from 'app/pages/Swap/context';
import { BaseSwapForm } from 'app/pages/Swap/form/BaseSwapForm';
import { ChainAssetInfo, SwapFieldName, TezosReviewData } from 'app/pages/Swap/form/interfaces';
import { SwapFormValue, SwapInputValue } from 'app/pages/Swap/form/SwapForm.form';
import { getDefaultSwapFormValues } from 'app/pages/Swap/form/utils';
import { buildTezosSwapOperations, TezosSwapBuildInput } from 'app/pages/Swap/preparation/tezos/build-swap-operations';
import { dispatch, useSelector } from 'app/store';
import { setOnRampAssetAction } from 'app/store/settings/actions';
import { loadSwapParamsAction } from 'app/store/swap/actions';
import { useSwapParamsSelector, useSwapTokenSelector, useSwapTokensSelector } from 'app/store/swap/selectors';
import { usePendingTezosTransactionsHashes } from 'app/store/tezos/pending-transactions/utils';
import OperationStatus from 'app/templates/OperationStatus';
import { toastError, toastUniqWarning } from 'app/toaster';
import { useFormAnalytics } from 'lib/analytics';
import { TEZOS_CHAIN_ASSET_SLUG } from 'lib/apis/wert';
import { isTezAsset, TEZ_TOKEN_SLUG } from 'lib/assets';
import { KNOWN_TOKENS_SLUGS } from 'lib/assets/known-tokens';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { useTezosAssetBalance } from 'lib/balances';
import { useGetTezosAccountTokenOrGasBalanceWithDecimals } from 'lib/balances/hooks';
import { useAssetFiatCurrencyPrice } from 'lib/fiat-currency';
import { t } from 'lib/i18n';
import {
  useCategorizedTezosAssetMetadata,
  useGetCategorizedAssetMetadata,
  useTezosTokensMetadataPresenceCheck
} from 'lib/metadata';
import { useAvailableRoute3TokensSlugs } from 'lib/route3/assets';
import { SWAP_THRESHOLD_TO_GET_CASHBACK } from 'lib/route3/constants';
import { isLiquidityBakingParamsResponse } from 'lib/route3/interfaces';
import { getPercentageRatio } from 'lib/route3/utils/get-percentage-ratio';
import { getRoute3TokenBySlug } from 'lib/route3/utils/get-route3-token-by-slug';
import { atomsToTokens, tokensToAtoms } from 'lib/temple/helpers';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { ZERO } from 'lib/utils/numbers';
import { calculateOutputAmounts, calculateSidePaymentsFromInput } from 'lib/utils/swap.utils';
import { useAccountForTezos, useTezosBlockLevel, useTezosMainnetChain } from 'temple/front';
import { getTezosToolkitWithSigner } from 'temple/front/tezos';

interface TezosSwapFormProps {
  slippageTolerance: number;
  onReview: SyncFn<TezosReviewData>;
  onSelectAssetClick: SyncFn<SwapFieldName>;
  selectedChainAssets: { from: string | null; to: string | null };
  handleToggleIconClick: EmptyFn;
}

export const TezosSwapForm: FC<TezosSwapFormProps> = ({
  slippageTolerance,
  onReview,
  onSelectAssetClick,
  selectedChainAssets,
  handleToggleIconClick
}) => {
  const account = useAccountForTezos();
  const network = useTezosMainnetChain();
  if (!account || !network) throw new DeadEndBoundaryError();

  const publicKeyHash = account.address;
  const tezos = getTezosToolkitWithSigner(network, publicKeyHash);
  const swapFormControl = useSwapFormControl();

  const { route3tokensSlugs } = useAvailableRoute3TokensSlugs();
  useTezosTokensMetadataPresenceCheck(network, route3tokensSlugs);

  const blockLevel = useTezosBlockLevel(network);
  const prevBlockLevelRef = useRef(blockLevel);
  const { data: route3Tokens } = useSwapTokensSelector();
  const swapParams = useSwapParamsSelector();
  const allUsdToTokenRates = useSelector(state => state.currency.usdToTokenRates.data);
  const getTokenMetadata = useGetCategorizedAssetMetadata(TEZOS_MAINNET_CHAIN_ID);
  const prevOutputRef = useRef(swapParams.data.output);
  const getTezosBalance = useGetTezosAccountTokenOrGasBalanceWithDecimals(publicKeyHash);

  const formAnalytics = useFormAnalytics('SwapForm');

  const sourceAssetInfo = useMemo<ChainAssetInfo | null>(() => {
    if (!selectedChainAssets.from) return null;

    const [networkKind, chainId, assetSlug] = parseChainAssetSlug(selectedChainAssets.from);
    return {
      networkKind,
      chainId: chainId.toString(),
      assetSlug
    };
  }, [selectedChainAssets.from]);

  const targetAssetInfo = useMemo<ChainAssetInfo | null>(() => {
    if (!selectedChainAssets.to) return null;

    const [networkKind, chainId, assetSlug] = parseChainAssetSlug(selectedChainAssets.to);
    return {
      networkKind,
      chainId: chainId.toString(),
      assetSlug
    };
  }, [selectedChainAssets.to]);

  const defaultValues = useMemo(
    () => getDefaultSwapFormValues(sourceAssetInfo, targetAssetInfo),
    [sourceAssetInfo, targetAssetInfo]
  );

  const form = useForm<SwapFormValue>({
    defaultValues,
    mode: 'onSubmit'
  });

  const { control, reset, setValue, formState, getValues, clearErrors, trigger } = form;
  const { isSubmitting, submitCount } = formState;
  const formSubmitted = submitCount > 0;

  const inputValue = useWatch({ name: 'input', control });
  const outputValue = useWatch({ name: 'output', control });

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

  const [trackedOperation, setTrackedOperation] = useState<{
    operation: BatchWalletOperation;
    startingBlockLevel: number;
  }>();
  const setTezosOperation = useCallback(
    (nextOperation: BatchWalletOperation | undefined, startingBlockLevel?: number) => {
      setTrackedOperation(
        nextOperation && startingBlockLevel !== undefined ? { operation: nextOperation, startingBlockLevel } : undefined
      );
    },
    []
  );

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
  const shouldShowNoRoutesAlert = Number(swapParams.data.input) > 0 && hopsAreAbsent;

  useEffect(() => {
    if (shouldShowNoRoutesAlert) {
      toastError(t('noRoutesFound'));
    }
  }, [shouldShowNoRoutesAlert]);

  const inputAssetPrice = useAssetFiatCurrencyPrice(inputValue.assetSlug ?? '', network.chainId);
  const outputAssetPrice = useAssetFiatCurrencyPrice(outputValue.assetSlug ?? '', network.chainId);

  const parseFiatValueToAssetAmount = useCallback(
    (fiatAmount: BigNumber.Value = ZERO, assetDecimals: number = 2, inputName: SwapFieldName = 'input') => {
      return new BigNumber(fiatAmount || '0')
        .dividedBy((inputName === 'input' ? inputAssetPrice : outputAssetPrice) ?? 1)
        .decimalPlaces(assetDecimals, BigNumber.ROUND_FLOOR);
    },
    [inputAssetPrice, outputAssetPrice]
  );

  const getSwapWithFeeParams = useCallback(
    (newInputValue: SwapInputValue, newOutputValue: SwapInputValue) => {
      const { assetSlug: inputAssetSlug, amount: inputAmount } = newInputValue;
      const outputAssetSlug = newOutputValue.assetSlug;
      const inputTokenUsdPrice = inputAssetSlug ? allUsdToTokenRates[inputAssetSlug] : '0';
      const inputTokenAmount = getValues('isFiatMode')
        ? parseFiatValueToAssetAmount(inputAmount, inputAssetMetadata.decimals, 'input')
        : inputAmount;
      const inputAmountInUsd = inputTokenAmount?.multipliedBy(inputTokenUsdPrice) ?? ZERO;

      const isInputTokenTempleToken = inputAssetSlug === KNOWN_TOKENS_SLUGS.TEMPLE;
      const isOutputTokenTempleToken = outputAssetSlug === KNOWN_TOKENS_SLUGS.TEMPLE;

      const isSwapAmountMoreThreshold = inputAmountInUsd
        .decimalPlaces(2, BigNumber.ROUND_CEIL)
        .gte(SWAP_THRESHOLD_TO_GET_CASHBACK);

      return {
        isInputTokenTempleToken,
        isOutputTokenTempleToken,
        isSwapAmountMoreThreshold
      };
    },
    [allUsdToTokenRates, inputAssetMetadata.decimals, parseFiatValueToAssetAmount, getValues]
  );

  const atomsInputValue = useMemo(() => {
    const inputValueToUse = getValues('isFiatMode')
      ? parseFiatValueToAssetAmount(inputValue.amount, inputAssetMetadata.decimals)
      : inputValue.amount;

    return tokensToAtoms(inputValueToUse ?? ZERO, inputAssetMetadata.decimals);
  }, [inputAssetMetadata.decimals, inputValue.amount, parseFiatValueToAssetAmount, getValues]);

  const isOutputTempleToken = outputValue.assetSlug === KNOWN_TOKENS_SLUGS.TEMPLE;

  const { minimumReceivedAtomic } = useMemo(
    () =>
      calculateOutputAmounts(
        atomsInputValue,
        swapParams.data.output,
        outputAssetMetadata.decimals,
        slippageRatio,
        isOutputTempleToken
      ),
    [atomsInputValue, swapParams.data.output, outputAssetMetadata.decimals, slippageRatio, isOutputTempleToken]
  );

  const dispatchLoadSwapParams = useCallback(
    (input: SwapInputValue, output: SwapInputValue) => {
      if (!input.assetSlug || !output.assetSlug) return;

      const inputMetadata = getTokenMetadata(input.assetSlug);

      if (!inputMetadata) return;

      const inputValueToUse = getValues('isFiatMode')
        ? parseFiatValueToAssetAmount(input.amount, inputAssetMetadata.decimals)
        : input.amount;

      const isOutputTempleToken = output.assetSlug === KNOWN_TOKENS_SLUGS.TEMPLE;

      const { swapInputMinusFeeAtomic: amount } = calculateSidePaymentsFromInput(
        tokensToAtoms(inputValueToUse ?? ZERO, inputMetadata.decimals),
        isOutputTempleToken
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
    [getTokenMetadata, inputAssetMetadata.decimals, parseFiatValueToAssetAmount, route3Tokens, tezos.rpc, getValues]
  );

  useEffect(() => {
    if (isDefined(fromRoute3Token) && isDefined(toRoute3Token) && prevBlockLevelRef.current !== blockLevel) {
      dispatchLoadSwapParams(inputValue, outputValue);
    }
    prevBlockLevelRef.current = blockLevel;
  }, [blockLevel, dispatchLoadSwapParams, fromRoute3Token, inputValue, outputValue, toRoute3Token]);

  const resetForm = useCallback(() => void reset(defaultValues), [defaultValues, reset]);

  const handleInputChange = useCallback(
    (newInputValue: SwapInputValue) => {
      const currentFormState = getValues();
      setValue('input', newInputValue);
      clearErrors('input');

      if (newInputValue.assetSlug && newInputValue.assetSlug === currentFormState.output.assetSlug) {
        setValue('output', { assetSlug: undefined, chainId: undefined, amount: undefined });
        return;
      }

      dispatchLoadSwapParams(newInputValue, currentFormState.output);
      if (formSubmitted) trigger();
    },
    [clearErrors, dispatchLoadSwapParams, getValues, setValue, formSubmitted, trigger]
  );

  const handleOutputChange = useCallback(
    (newOutputValue: SwapInputValue) => {
      const currentFormState = getValues();
      setValue('output', newOutputValue);
      clearErrors('output');

      if (newOutputValue.assetSlug && newOutputValue.assetSlug === currentFormState.input.assetSlug) {
        setValue('input', { assetSlug: undefined, chainId: undefined, amount: undefined });
        return;
      }

      dispatchLoadSwapParams(currentFormState.input, newOutputValue);
      if (formSubmitted) trigger();
    },
    [clearErrors, dispatchLoadSwapParams, getValues, setValue, formSubmitted, trigger]
  );

  const handleSelectedAssetChange = useCallback(
    (field: SwapFieldName, chainAssetSlug: string) => {
      const [, chainId, assetSlug] = parseChainAssetSlug(chainAssetSlug);
      const currentFormState = getValues();
      const amount = field === 'input' ? currentFormState.input.amount : currentFormState.output.amount;

      if (field === 'input') {
        handleInputChange({
          assetSlug,
          chainId: chainId.toString(),
          amount
        });

        return;
      }

      handleOutputChange({
        assetSlug,
        chainId: chainId.toString(),
        amount
      });
    },
    [getValues, handleInputChange, handleOutputChange]
  );

  useEffect(() => {
    if (!swapFormControl) return;
    const next = {
      ...(swapFormControl.current ?? {}),
      resetForm,
      setTezosOperation,
      handleSelectedAssetChange
    };
    swapFormControl.current = next;

    return () => {
      if (swapFormControl.current?.resetForm === resetForm) {
        const updated = { ...(swapFormControl.current ?? {}) };
        delete updated.resetForm;
        swapFormControl.current = updated;
      }
      if (swapFormControl.current?.setTezosOperation === setTezosOperation) {
        const updated = { ...(swapFormControl.current ?? {}) };
        delete updated.setTezosOperation;
        swapFormControl.current = updated;
      }
      if (swapFormControl.current?.handleSelectedAssetChange === handleSelectedAssetChange) {
        const updated = { ...(swapFormControl.current ?? {}) };
        delete updated.handleSelectedAssetChange;
        swapFormControl.current = updated;
      }
    };
  }, [handleSelectedAssetChange, swapFormControl, resetForm, setTezosOperation]);

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
        slippageRatio,
        isOutputTempleToken
      );

      const amount = atomsToTokens(expectedReceivedAtomic, outputAssetMetadata.decimals);
      setValue('output', {
        assetSlug: outputValue.assetSlug,
        amount: getValues('isFiatMode')
          ? amount.times(outputAssetPrice).decimalPlaces(2, BigNumber.ROUND_FLOOR)
          : amount
      });
    }
  }, [
    atomsInputValue,
    getValues,
    isOutputTempleToken,
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
      const formattedMaxAmount = getValues('isFiatMode')
        ? inputTokenMaxAmount.times(inputAssetPrice).decimalPlaces(2, BigNumber.ROUND_FLOOR)
        : inputTokenMaxAmount;

      handleInputChange({ assetSlug: inputValue.assetSlug, amount: formattedMaxAmount });

      if (isTezAsset(inputValue.assetSlug) && inputTokenBalance?.lte(EXCHANGE_XTZ_RESERVE)) {
        toastUniqWarning(t('notEnoughTezForFee'), true);
      }
    }
  }, [handleInputChange, inputAssetPrice, inputTokenBalance, inputTokenMaxAmount, inputValue.assetSlug, getValues]);

  const pendingTxHashes = usePendingTezosTransactionsHashes(publicKeyHash, network.chainId);
  const otherOperationsPending = pendingTxHashes.length > 0;
  const tezBalanceTooLow =
    inputValue.assetSlug === TEZ_TOKEN_SLUG &&
    Boolean(getTezosBalance(TEZOS_MAINNET_CHAIN_ID, TEZ_TOKEN_SLUG)?.lte(EXCHANGE_XTZ_RESERVE));

  const getBuildInput = (): TezosSwapBuildInput | null => {
    if (!fromRoute3Token || !toRoute3Token) {
      return null;
    }

    return {
      tezos,
      accountPkh: publicKeyHash,
      fromRoute3Token,
      toRoute3Token,
      swapParams: swapParams.data,
      inputAtomic: atomsInputValue,
      slippageRatio,
      outputDecimals: outputAssetMetadata.decimals,
      outputSymbol: outputAssetMetadata.symbol,
      ...getSwapWithFeeParams(inputValue, outputValue)
    };
  };

  const onSubmit = async () => {
    if (isSubmitting) return;

    if (otherOperationsPending) {
      toastError(t('otherOperationsPendingError'));

      return;
    }

    if (tezBalanceTooLow) {
      dispatch(setOnRampAssetAction({ chainAssetSlug: TEZOS_CHAIN_ASSET_SLUG }));

      return;
    }

    const analyticsProperties = {
      inputAsset: inputAssetMetadata.symbol,
      outputAsset: outputAssetMetadata.symbol,
      inputAmount: inputValue.amount?.toString(),
      outputAmount: outputValue.amount?.toString(),
      network: 'Tezos'
    };

    formAnalytics.trackSubmit(analyticsProperties);

    const buildInput = getBuildInput();
    if (!buildInput || !swapParams.data.output || !inputValue.assetSlug) {
      return;
    }

    try {
      setTezosOperation(undefined);

      const operations = await buildTezosSwapOperations(buildInput);

      if (!operations) {
        return;
      }

      const { opParams, cashbackInTkey, minimumReceived } = operations;

      onReview({
        account,
        network,
        opParams,
        cashbackInTkey,
        minimumReceived,
        onConfirm: (operation, startingBlockLevel) => {
          resetForm();
          setTezosOperation(operation, startingBlockLevel);
        }
      });

      formAnalytics.trackSubmitSuccess({ ...analyticsProperties, cashback: isDefined(cashbackInTkey) });
    } catch (err: any) {
      console.error(err);
      if (err.message !== 'Declined') {
        toastError(err.message);
      }
      formAnalytics.trackSubmitFail(analyticsProperties);
    }
  };

  return (
    <FormProvider {...form}>
      {trackedOperation && (
        <div className="px-4 hidden">
          <OperationStatus
            network={network}
            typeTitle={t('swapNoun')}
            operation={trackedOperation.operation}
            startingBlockLevel={trackedOperation.startingBlockLevel}
          />
        </div>
      )}
      <BaseSwapForm
        isEvmNetwork={false}
        inputAssetSlug={inputValue.assetSlug}
        inputAssetSymbol={inputAssetMetadata.symbol}
        inputAssetDecimals={inputAssetMetadata.decimals}
        inputAssetPrice={inputAssetPrice}
        inputAssetBalance={inputTokenBalance}
        inputTokenAmount={inputValue.amount}
        inputAmount={isDefined(swapParams.data.input) ? new BigNumber(swapParams.data.input) : undefined}
        inputChainId={inputValue.chainId}
        inputTokenMaxAmount={inputTokenMaxAmount}
        outputAssetSlug={outputValue.assetSlug}
        outputAssetSymbol={outputAssetMetadata.symbol}
        outputAssetDecimals={outputAssetMetadata.decimals}
        outputAssetPrice={outputAssetPrice}
        outputAssetBalance={outputTokenBalance}
        outputTokenAmount={outputValue.amount}
        outputAmount={isDefined(swapParams.data.output) ? new BigNumber(swapParams.data.output) : undefined}
        outputChainId={outputValue.chainId}
        minimumReceivedAmount={minimumReceivedAtomic}
        swapParamsAreLoading={swapParams.isLoading}
        swapRouteSteps={swapRouteSteps}
        provider="3route"
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
