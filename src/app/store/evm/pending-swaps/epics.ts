import retry from 'async-retry';
import { Epic, combineEpics } from 'redux-observable';
import { catchError, delay, filter, from, map, mergeMap, of, repeat, switchMap, withLatestFrom } from 'rxjs';
import { ofType } from 'ts-action-operators';

import { dispatch } from 'app/store';
import type { RootState } from 'app/store/root-state.type';
import { getEvmSwapStatus } from 'lib/apis/temple/endpoints/evm';
import { fetchEvmRawBalance } from 'lib/evm/on-chain/balance';
import { fetchEvmTokenMetadataFromChain } from 'lib/evm/on-chain/metadata';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';

import { putNewEvmTokenAction } from '../assets/actions';
import { processLoadedOnchainBalancesAction } from '../balances/actions';
import { putEvmTokensMetadataAction } from '../tokens-metadata/actions';

import {
  monitorPendingSwapsAction,
  updatePendingSwapStatusAction,
  incrementSwapCheckAttemptsAction,
  removePendingEvmSwapAction
} from './actions';
import { selectAllPendingSwaps } from './selectors';
import { getEvmNetworkEssentialsByChainId } from './utils';

const MONITOR_INTERVAL = 10_000; // 10 seconds
const MAX_CHECK_ATTEMPTS = 100; // Stop checking after ~16 minutes
const MAX_BALANCE_ATTEMPTS = 20;
const BALANCE_CHECK_INTERVAL = 3000;

// Epic that monitors all pending swaps
const monitorPendingSwapsEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(monitorPendingSwapsAction),
    withLatestFrom(state$),
    switchMap(([, state]) => {
      const pendingSwaps = selectAllPendingSwaps(state as RootState);

      if (pendingSwaps.length === 0) {
        return of(); // No swaps to monitor
      }

      return from(pendingSwaps).pipe(
        mergeMap(swap => {
          // Skip if too many attempts
          if (swap.checkAttempts >= MAX_CHECK_ATTEMPTS) {
            console.warn(`Swap ${swap.txHash} exceeded max check attempts, removing`);
            return of(removePendingEvmSwapAction({ txHash: swap.txHash }));
          }

          // Check swap status
          return from(
            retry(
              async () =>
                await getEvmSwapStatus({
                  txHash: swap.txHash,
                  fromChain: swap.fromChainId,
                  toChain: swap.toChainId,
                  bridge: swap.bridge
                }),
              { retries: 3, minTimeout: 2000 }
            )
          ).pipe(
            mergeMap(result => {
              const actions = [incrementSwapCheckAttemptsAction({ txHash: swap.txHash })];

              if (result.status === 'DONE') {
                actions.push(
                  updatePendingSwapStatusAction({
                    txHash: swap.txHash,
                    status: 'done',
                    lastCheckedAt: Date.now()
                  })
                );

                // Trigger balance check
                return from([...actions, { type: 'ENSURE_OUTPUT_BALANCE', swap }]);
              }

              if (result.status === 'FAILED') {
                actions.push(
                  updatePendingSwapStatusAction({
                    txHash: swap.txHash,
                    status: 'failed',
                    lastCheckedAt: Date.now()
                  })
                );

                // Remove after marking as failed
                setTimeout(() => {
                  dispatch(removePendingEvmSwapAction({ txHash: swap.txHash }));
                }, 5000);
              }

              return from(actions);
            }),
            catchError(error => {
              console.error(`Error checking swap ${swap.txHash}:`, error);
              return of(incrementSwapCheckAttemptsAction({ txHash: swap.txHash }));
            })
          );
        })
      );
    })
  );

// Epic to ensure output token balance is present
const ensureOutputBalanceEpic: Epic = action$ =>
  action$.pipe(
    filter((action: any) => action.type === 'ENSURE_OUTPUT_BALANCE'),
    mergeMap((action: any) => {
      const { swap } = action;

      return from(
        (async () => {
          if (isEvmNativeTokenSlug(swap.outputTokenSlug)) {
            // Native token, just remove the pending swap
            dispatch(removePendingEvmSwapAction({ txHash: swap.txHash }));
            return;
          }

          const outputNetwork = getEvmNetworkEssentialsByChainId(swap.outputNetworkChainId);
          if (!outputNetwork) {
            console.error('Output network not found');
            dispatch(removePendingEvmSwapAction({ txHash: swap.txHash }));
            return;
          }

          // Try to fetch balance up to MAX_BALANCE_ATTEMPTS times
          for (let attempt = 0; attempt < MAX_BALANCE_ATTEMPTS; attempt++) {
            try {
              const balance = await fetchEvmRawBalance(outputNetwork, swap.outputTokenSlug, swap.accountPkh);

              if (balance.gt(0)) {
                // Fetch metadata and dispatch actions
                const metadata = await fetchEvmTokenMetadataFromChain(outputNetwork, swap.outputTokenSlug);

                dispatch(
                  putNewEvmTokenAction({
                    publicKeyHash: swap.accountPkh,
                    chainId: outputNetwork.chainId,
                    assetSlug: swap.outputTokenSlug
                  })
                );

                dispatch(
                  putEvmTokensMetadataAction({
                    chainId: outputNetwork.chainId,
                    records: { [swap.outputTokenSlug]: metadata }
                  })
                );

                dispatch(
                  processLoadedOnchainBalancesAction({
                    balances: { [swap.outputTokenSlug]: balance.toFixed() },
                    timestamp: Date.now(),
                    account: swap.accountPkh,
                    chainId: outputNetwork.chainId
                  })
                );

                // Successfully found balance, remove from pending
                dispatch(removePendingEvmSwapAction({ txHash: swap.txHash }));
                return;
              }
            } catch (error) {
              console.warn(`Attempt ${attempt + 1} failed to fetch balance:`, error);
            }

            // Wait before next attempt
            await new Promise(resolve => setTimeout(resolve, BALANCE_CHECK_INTERVAL));
          }

          // Max attempts reached, remove anyway
          console.warn(`Could not confirm balance for swap ${swap.txHash} after ${MAX_BALANCE_ATTEMPTS} attempts`);
          dispatch(removePendingEvmSwapAction({ txHash: swap.txHash }));
        })()
      ).pipe(
        map(() => ({ type: 'BALANCE_CHECK_COMPLETE' })),
        catchError(error => {
          console.error('Error ensuring output balance:', error);
          dispatch(removePendingEvmSwapAction({ txHash: swap.txHash }));
          return of({ type: 'BALANCE_CHECK_ERROR' });
        })
      );
    })
  );

// Epic that triggers monitoring at regular intervals when there are pending swaps
const periodicMonitorTriggerEpic: Epic = (_, state$) =>
  of(null).pipe(
    delay(MONITOR_INTERVAL),
    repeat(),
    withLatestFrom(state$),
    filter(([, state]) => {
      const pendingSwaps = selectAllPendingSwaps(state as RootState);
      return pendingSwaps.length > 0;
    }),
    map(() => monitorPendingSwapsAction())
  );

export const pendingEvmSwapsEpics = combineEpics(
  monitorPendingSwapsEpic,
  ensureOutputBalanceEpic,
  periodicMonitorTriggerEpic
);
