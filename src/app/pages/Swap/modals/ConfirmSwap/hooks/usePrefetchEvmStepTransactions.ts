import React, { useEffect, useMemo, useRef, useState } from 'react';

import { getStepTransaction, LiFiStep } from '@lifi/sdk';
import BigNumber from 'bignumber.js';

import { toastError } from 'app/toaster';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useGetEvmTokenBalanceWithDecimals } from 'lib/balances/hooks';
import { EVM_ZERO_ADDRESS } from 'lib/constants';
import { t } from 'lib/i18n';
import { atomsToTokens } from 'lib/temple/helpers';
import { useAllEvmChains } from 'temple/front';

export function usePrefetchEvmStepTransactions(args: {
  opened: boolean;
  actionsInitialized: boolean;
  steps: LiFiStep[];
  senderAddress?: string;
  cancelledRef: React.MutableRefObject<boolean>;
  onRequestClose: EmptyFn;
}) {
  const { opened, actionsInitialized, steps, senderAddress, cancelledRef, onRequestClose } = args;

  const allEvmChains = useAllEvmChains();
  const getGasBalance = useGetEvmTokenBalanceWithDecimals(senderAddress as HexString);

  const [prefetchedStepsByIndex, setPrefetchedStepsByIndex] = useState<Record<number, LiFiStep>>({});
  const [progressionBlocked, setProgressionBlocked] = useState(false);

  const prefetchErrorHandledRef = useRef(false);
  const shownInsufficientGasRef = useRef(false);

  useEffect(() => {
    setPrefetchedStepsByIndex({});
    setProgressionBlocked(false);
    prefetchErrorHandledRef.current = false;
    shownInsufficientGasRef.current = false;
  }, [opened]);

  useEffect(() => {
    if (!opened) return;
    if (!actionsInitialized) return;
    if (!steps || steps.length === 0) return;

    let isCancelled = false;

    const prefetchStepTransactions = async () => {
      try {
        const stepTxResults = await Promise.all(
          steps.map(async (step, index) => {
            try {
              if (isCancelled || cancelledRef.current || !opened) {
                return { index, step };
              }
              const updated = await getStepTransaction(step);
              if (isCancelled || cancelledRef.current || !opened) {
                return { index, step: null };
              }
              return { index, step: updated };
            } catch {
              if (!isCancelled && !cancelledRef.current && opened && !prefetchErrorHandledRef.current) {
                prefetchErrorHandledRef.current = true;
                toastError('Failed to prepare transaction');
                onRequestClose();
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
  }, [opened, actionsInitialized, steps, cancelledRef, onRequestClose]);

  const stepsToCheckForGas = useMemo(() => {
    return steps.map((step, index) => prefetchedStepsByIndex[index] ?? step);
  }, [steps, prefetchedStepsByIndex]);

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
            const fromAmountTokens = atomsToTokens(
              new BigNumber(step.action.fromAmount),
              step.action.fromToken.decimals ?? 0
            );

            if (balanceTokens.minus(feeTokens).minus(fromAmountTokens).lte(feeTokens)) {
              shownInsufficientGasRef.current = true;
              setProgressionBlocked(true);
              toastError(t('balanceTooLow'));
              break;
            }
          }

          if (balanceTokens.lte(feeTokens)) {
            shownInsufficientGasRef.current = true;
            setProgressionBlocked(true);
            toastError(t('balanceTooLow'));
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
  }, [opened, actionsInitialized, stepsToCheckForGas, allEvmChains, getGasBalance, cancelledRef]);

  return { prefetchedStepsByIndex, progressionBlocked };
}
