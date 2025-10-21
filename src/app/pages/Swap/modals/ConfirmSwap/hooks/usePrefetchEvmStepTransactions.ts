import React, { useEffect, useMemo, useRef, useState } from 'react';

import { getStepTransaction, LiFiStep } from '@lifi/sdk';
import BigNumber from 'bignumber.js';

import { toastError } from 'app/toaster';
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

    const prefetchStepTransactions = async () => {
      try {
        const stepTxResults = await Promise.all(
          stableSteps.map(async (step, index) => {
            try {
              if (isCancelled || cancelledRef.current || !opened) {
                return { index, step };
              }
              const key = `${index}:${step.id}`;
              if (inflightByKeyRef.current[key]) {
                const res = await inflightByKeyRef.current[key];
                if (isCancelled || cancelledRef.current || !opened) return { index, step: null };
                return { index, step: res };
              }
              const promise = (async () => {
                try {
                  const updatedInner = await getStepTransaction(step);
                  if (isCancelled || cancelledRef.current || !opened) {
                    return null;
                  }
                  return updatedInner;
                } catch {
                  if (!isCancelled && !cancelledRef.current && opened && !prefetchErrorHandledRef.current) {
                    prefetchErrorHandledRef.current = true;
                    toastError('Failed to prepare transaction');
                  }
                  return null;
                }
              })();
              inflightByKeyRef.current[key] = promise;
              const updated = await promise;
              delete inflightByKeyRef.current[key];
              if (isCancelled || cancelledRef.current || !opened) {
                return { index, step: null };
              }
              return { index, step: updated };
            } catch {
              if (!isCancelled && !cancelledRef.current && opened && !prefetchErrorHandledRef.current) {
                prefetchErrorHandledRef.current = true;
                toastError('Failed to prepare transaction');
              }
              return { index, step: null };
            }
          })
        );

        if (isCancelled || cancelledRef.current || !opened) return;

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

    const runGasChecks = async () => {
      try {
        for (let i = 0; i < stepsToCheckForGas.length; i++) {
          if (isCancelled || cancelledRef.current || !opened) return;
          const step = stepsToCheckForGas[i];
          const chain = allEvmChains[step.action.fromChainId];
          if (!chain) continue;
          const chainName = chain.name ?? chain.currency?.name ?? String(chain.chainId);

          const balanceAtomic = getGasBalance(chain.chainId, EVM_TOKEN_SLUG);
          const gasCosts = step.estimate.gasCosts;
          const firstCost = Array.isArray(gasCosts) ? gasCosts[0] : undefined;
          if (!firstCost?.price || !firstCost?.limit) continue;

          const gasPriceAtomic = new BigNumber(firstCost.price);
          const gasLimit = new BigNumber(firstCost.limit);
          if (gasPriceAtomic.lte(0) || gasLimit.lte(0)) continue;

          const feeAtomic = gasPriceAtomic.times(gasLimit);
          const feeTokens = atomsToTokens(feeAtomic, chain.currency.decimals);

          const balanceTokens = new BigNumber(balanceAtomic ?? '0');

          const isNativeInput = step.action.fromToken.address === EVM_ZERO_ADDRESS;
          if (isNativeInput) {
            const isFromAmountProvidedByPrev = stableSteps
              .slice(0, i)
              .some(
                prev =>
                  prev.action.toChainId === step.action.fromChainId &&
                  prev.action.toToken.address === step.action.fromToken.address
              );

            const fromAmountTokens = atomsToTokens(
              new BigNumber(step.action.fromAmount),
              step.action.fromToken.decimals ?? 0
            );

            if (isFromAmountProvidedByPrev) {
              if (balanceTokens.lt(feeTokens)) {
                shownInsufficientGasRef.current = true;
                setProgressionBlocked(true);
                toastError(t('InsufficientBalance', chainName));
                break;
              }
            } else if (balanceTokens.lt(fromAmountTokens.plus(feeTokens))) {
              shownInsufficientGasRef.current = true;
              setProgressionBlocked(true);
              toastError(t('InsufficientBalance', chainName));
              break;
            }
          }

          if (balanceTokens.lte(feeTokens)) {
            shownInsufficientGasRef.current = true;
            setProgressionBlocked(true);
            toastError(t('InsufficientBalance', chainName));
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
