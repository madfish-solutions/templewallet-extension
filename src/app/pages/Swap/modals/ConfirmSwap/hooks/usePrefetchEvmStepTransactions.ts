import React, { useEffect, useMemo, useRef, useState } from 'react';

import { LiFiStep } from '@lifi/sdk';
import BigNumber from 'bignumber.js';

import { toastError } from 'app/toaster';
import { getEvmStepTransaction } from 'lib/apis/temple/endpoints/evm';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useGetEvmTokenBalanceWithDecimals } from 'lib/balances/hooks';
import { EVM_ZERO_ADDRESS } from 'lib/constants';
import { t } from 'lib/i18n';
import { atomsToTokens } from 'lib/temple/helpers';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useAllEvmChains } from 'temple/front';

export function usePrefetchEvmStepTransactions(args: {
  opened: boolean;
  actionsInitialized: boolean;
  steps: LiFiStep[];
  senderAddress?: string;
  cancelledRef: React.MutableRefObject<boolean>;
}) {
  const { opened, actionsInitialized, steps, senderAddress, cancelledRef } = args;
  const stableSteps = useMemoWithCompare(() => steps, [steps]);

  const allEvmChains = useAllEvmChains();
  const getGasBalance = useGetEvmTokenBalanceWithDecimals(senderAddress as HexString);

  const [prefetchedStepsByIndex, setPrefetchedStepsByIndex] = useState<Record<number, LiFiStep>>({});
  const [progressionBlocked, setProgressionBlocked] = useState(false);

  const prefetchErrorHandledRef = useRef(false);
  const shownInsufficientGasRef = useRef(false);
  const inflightByKeyRef = useRef<Record<string, Promise<LiFiStep | null> | undefined>>({});

  useEffect(() => {
    setPrefetchedStepsByIndex({});
    setProgressionBlocked(false);
    prefetchErrorHandledRef.current = false;
    shownInsufficientGasRef.current = false;
  }, [opened]);

  useEffect(() => {
    if (!opened) return;
    if (!actionsInitialized) return;
    if (!stableSteps || stableSteps.length === 0) return;

    let isCancelled = false;

    const isAborted = () => isCancelled || cancelledRef.current || !opened;

    const showPrefetchErrorOnce = () => {
      if (!isAborted() && !prefetchErrorHandledRef.current) {
        prefetchErrorHandledRef.current = true;
        toastError('Failed to prepare transaction');
      }
    };

    const getInflightKey = (index: number, step: LiFiStep) => `${index}:${step.id}`;

    const prefetchOne = async (step: LiFiStep, index: number) => {
      if (isAborted()) return { index, step };

      const key = getInflightKey(index, step);

      if (inflightByKeyRef.current[key]) {
        const res = await inflightByKeyRef.current[key]!;
        return isAborted() ? { index, step: null } : { index, step: res };
      }

      const promise: Promise<LiFiStep | null> = (async () => {
        try {
          const updated = await getEvmStepTransaction(step);
          return isAborted() ? null : updated;
        } catch {
          showPrefetchErrorOnce();
          return null;
        }
      })();

      inflightByKeyRef.current[key] = promise;
      const updated = await promise;
      delete inflightByKeyRef.current[key];
      return isAborted() ? { index, step: null } : { index, step: updated };
    };

    const prefetchStepTransactions = async () => {
      try {
        const stepTxResults = await Promise.all(stableSteps.map(prefetchOne));
        if (isAborted()) return;

        const nextPrefetched: Record<number, LiFiStep> = {};
        for (const result of stepTxResults) if (result.step) nextPrefetched[result.index] = result.step;
        setPrefetchedStepsByIndex(nextPrefetched);
      } catch (e) {
        console.warn(e);
      }
    };

    void prefetchStepTransactions();

    return () => {
      isCancelled = true;
    };
  }, [opened, actionsInitialized, stableSteps, cancelledRef]);

  const stepsToCheckForGas = useMemo(() => {
    return stableSteps.map((step, index) => prefetchedStepsByIndex[index] ?? step);
  }, [stableSteps, prefetchedStepsByIndex]);

  useEffect(() => {
    if (!opened) return;
    if (!actionsInitialized) return;
    if (!stepsToCheckForGas.length) return;
    if (shownInsufficientGasRef.current) return;

    let isCancelled = false;

    const isAborted = () => isCancelled || cancelledRef.current || !opened;

    const blockProgression = (chainName: string) => {
      shownInsufficientGasRef.current = true;
      setProgressionBlocked(true);
      toastError(t('InsufficientBalance', chainName));
    };

    const previousStepsProvideFromAmount = (index: number, step: LiFiStep) =>
      stableSteps
        .slice(0, index)
        .some(
          prev =>
            prev.action.toChainId === step.action.fromChainId &&
            prev.action.toToken.address === step.action.fromToken.address
        );

    const computeFeeTokens = (step: LiFiStep, chain: any) => {
      const gasCosts = step.estimate.gasCosts;
      const firstCost = Array.isArray(gasCosts) ? gasCosts[0] : undefined;
      if (!firstCost?.price || !firstCost?.limit) return null;

      const gasPriceAtomic = new BigNumber(firstCost.price);
      const gasLimit = new BigNumber(firstCost.limit);
      if (gasPriceAtomic.lte(0) || gasLimit.lte(0)) return null;

      const feeAtomic = gasPriceAtomic.times(gasLimit);
      return atomsToTokens(feeAtomic, chain.currency.decimals);
    };

    const runGasChecks = async () => {
      try {
        for (let i = 0; i < stepsToCheckForGas.length; i++) {
          if (isAborted()) return;

          const step = stepsToCheckForGas[i];
          const chain = allEvmChains[step.action.fromChainId];
          if (!chain) continue;
          const chainName = chain.name ?? chain.currency?.name ?? String(chain.chainId);

          const feeTokens = computeFeeTokens(step, chain);
          if (!feeTokens) continue;

          const balanceAtomic = getGasBalance(chain.chainId, EVM_TOKEN_SLUG);
          const balanceTokens = new BigNumber(balanceAtomic ?? '0');

          const isNativeInput = step.action.fromToken.address === EVM_ZERO_ADDRESS;
          if (isNativeInput) {
            const fromAmountTokens = atomsToTokens(
              new BigNumber(step.action.fromAmount),
              step.action.fromToken.decimals ?? 0
            );

            if (previousStepsProvideFromAmount(i, step)) {
              if (balanceTokens.lt(feeTokens)) {
                blockProgression(chainName);
                break;
              }
            } else if (balanceTokens.lt(fromAmountTokens.plus(feeTokens))) {
              blockProgression(chainName);
              break;
            }
          }

          if (balanceTokens.lte(feeTokens)) {
            blockProgression(chainName);
            break;
          }
        }
      } catch (e) {
        console.warn(e);
      }
    };

    void runGasChecks();

    return () => {
      isCancelled = true;
    };
  }, [opened, actionsInitialized, stepsToCheckForGas, stableSteps, allEvmChains, getGasBalance, cancelledRef]);

  return { prefetchedStepsByIndex, progressionBlocked };
}
