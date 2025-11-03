import retry from 'async-retry';
import { Action } from 'redux';
import { Epic, combineEpics } from 'redux-observable';
import { catchError, concat, delay, filter, from, map, mergeMap, of, repeat, withLatestFrom } from 'rxjs';
import { ofType } from 'ts-action-operators';

import type { RootState } from 'app/store/root-state.type';
import { toastError } from 'app/toaster';
import { getEvmSwapStatus } from 'lib/apis/temple/endpoints/evm';
import { fetchEvmNativeBalance, fetchEvmRawBalance } from 'lib/evm/on-chain/balance';
import { fetchEvmTokenMetadataFromChain } from 'lib/evm/on-chain/metadata';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';

import { putNewEvmTokenAction } from '../assets/actions';
import { processLoadedOnchainBalancesAction } from '../balances/actions';
import { putEvmTokensMetadataAction } from '../tokens-metadata/actions';

import {
  monitorPendingSwapsAction,
  updatePendingSwapStatusAction,
  incrementSwapCheckAttemptsAction,
  removePendingEvmSwapAction,
  ensureOutputBalanceAction,
  cleanupOutdatedSwapsAction
} from './actions';
import { selectAllPendingSwaps } from './selectors';

const MONITOR_INTERVAL = 10_000;
const MAX_CHECK_ATTEMPTS = 100;
const MAX_BALANCE_ATTEMPTS = 20;
const BALANCE_CHECK_INTERVAL = 3_000;
const SAME_CHAIN_BALANCE_CHECK_INTERVAL = 1_000;
export const MAX_PENDING_SWAP_AGE = 24 * 60 * 60 * 1000; // 24 hours

const monitorPendingSwapsEpic: Epic<Action, Action, RootState> = (action$, state$) =>
  action$.pipe(
    ofType(monitorPendingSwapsAction),
    withLatestFrom(state$),
    mergeMap(([, state]) => {
      const pendingSwaps = selectAllPendingSwaps(state);

      if (pendingSwaps.length === 0) {
        return of();
      }

      return from(pendingSwaps).pipe(
        mergeMap(swap => {
          if (swap.checkAttempts >= MAX_CHECK_ATTEMPTS) {
            console.warn(`Swap ${swap.txHash} exceeded max check attempts, removing`);
            return of(removePendingEvmSwapAction({ txHash: swap.txHash }));
          }

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
              const { status } = result;

              if (status === 'DONE') {
                return from([
                  ...actions,
                  updatePendingSwapStatusAction({
                    txHash: swap.txHash,
                    status: 'DONE',
                    lastCheckedAt: Date.now()
                  }),
                  ensureOutputBalanceAction({ swap })
                ]);
              }

              if (status === 'FAILED') {
                const immediateActions = [
                  ...actions,
                  updatePendingSwapStatusAction({
                    txHash: swap.txHash,
                    status: 'FAILED',
                    lastCheckedAt: Date.now()
                  })
                ];

                toastError('Swap transaction failed', true, {
                  hash: swap.txHash,
                  blockExplorerHref: swap.blockExplorerUrl
                });

                return concat(
                  from(immediateActions),
                  of(removePendingEvmSwapAction({ txHash: swap.txHash })).pipe(delay(5000))
                );
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

const ensureOutputBalanceEpic: Epic<Action, Action, RootState> = action$ =>
  action$.pipe(
    ofType(ensureOutputBalanceAction),
    mergeMap(action => {
      const { swap } = action.payload;
      const { outputNetwork } = swap;

      return from(
        (async () => {
          const actionsToDispatch = [];

          if (!outputNetwork) {
            console.error('Output network not found');
            return [removePendingEvmSwapAction({ txHash: swap.txHash })];
          }

          // For native tokens, just verify balance increased
          if (isEvmNativeTokenSlug(swap.outputTokenSlug)) {
            try {
              const balance = await fetchEvmNativeBalance(swap.accountPkh, outputNetwork);

              if (balance.gt(0)) {
                actionsToDispatch.push(
                  processLoadedOnchainBalancesAction({
                    balances: { [swap.outputTokenSlug]: balance.toFixed() },
                    timestamp: Date.now(),
                    account: swap.accountPkh,
                    chainId: outputNetwork.chainId
                  })
                );
              }
            } catch (error) {
              console.warn('Failed to fetch native balance:', error);
            }

            return [...actionsToDispatch, removePendingEvmSwapAction({ txHash: swap.txHash })];
          }

          // Optimize balance check interval for same-chain swaps
          const isSameChain = swap.fromChainId === swap.toChainId;
          const checkInterval = isSameChain ? SAME_CHAIN_BALANCE_CHECK_INTERVAL : BALANCE_CHECK_INTERVAL;

          for (let attempt = 0; attempt < MAX_BALANCE_ATTEMPTS; attempt++) {
            try {
              const balance = await fetchEvmRawBalance(outputNetwork, swap.outputTokenSlug, swap.accountPkh);

              if (balance.gt(0)) {
                const metadata = await fetchEvmTokenMetadataFromChain(outputNetwork, swap.outputTokenSlug);

                actionsToDispatch.push(
                  putNewEvmTokenAction({
                    publicKeyHash: swap.accountPkh,
                    chainId: outputNetwork.chainId,
                    assetSlug: swap.outputTokenSlug
                  }),
                  putEvmTokensMetadataAction({
                    chainId: outputNetwork.chainId,
                    records: { [swap.outputTokenSlug]: metadata }
                  }),
                  processLoadedOnchainBalancesAction({
                    balances: { [swap.outputTokenSlug]: balance.toFixed() },
                    timestamp: Date.now(),
                    account: swap.accountPkh,
                    chainId: outputNetwork.chainId
                  }),
                  removePendingEvmSwapAction({ txHash: swap.txHash })
                );

                return actionsToDispatch;
              }
            } catch (error) {
              console.warn(`Attempt ${attempt + 1} failed to fetch balance:`, error);
            }

            // Wait before next attempt
            await new Promise(resolve => setTimeout(resolve, checkInterval));
          }

          console.warn(`Could not confirm balance for swap ${swap.txHash} after ${MAX_BALANCE_ATTEMPTS} attempts`);
          return [removePendingEvmSwapAction({ txHash: swap.txHash })];
        })()
      ).pipe(
        mergeMap(actions => from(actions)),
        catchError(error => {
          console.error('Error ensuring output balance:', error);
          return of(removePendingEvmSwapAction({ txHash: swap.txHash }));
        })
      );
    })
  );

const periodicMonitorTriggerEpic: Epic<Action, Action, RootState> = (_, state$) =>
  concat(
    // Emit immediately on startup
    of(null).pipe(
      withLatestFrom(state$),
      filter(([, state]) => {
        const pendingSwaps = selectAllPendingSwaps(state);
        return pendingSwaps.length > 0;
      }),
      map(() => monitorPendingSwapsAction())
    ),
    // Then repeat every MONITOR_INTERVAL
    of(null).pipe(
      delay(MONITOR_INTERVAL),
      repeat(),
      withLatestFrom(state$),
      filter(([, state]) => {
        const pendingSwaps = selectAllPendingSwaps(state);
        return pendingSwaps.length > 0;
      }),
      map(() => monitorPendingSwapsAction())
    )
  );

const cleanupOutdatedSwapsEpic: Epic<Action, Action, RootState> = (action$, state$) =>
  action$.pipe(
    ofType(cleanupOutdatedSwapsAction),
    withLatestFrom(state$),
    mergeMap(([, state]) => {
      const pendingSwaps = selectAllPendingSwaps(state);
      const now = Date.now();
      const outdatedSwaps = pendingSwaps.filter(swap => {
        const age = now - swap.submittedAt;
        return age > MAX_PENDING_SWAP_AGE;
      });

      if (outdatedSwaps.length > 0) {
        console.log(`Cleaning up ${outdatedSwaps.length} outdated pending swaps`);
        return from(
          outdatedSwaps.map(swap =>
            removePendingEvmSwapAction({
              txHash: swap.txHash
            })
          )
        );
      }

      return of();
    })
  );

export const pendingEvmSwapsEpics = combineEpics(
  monitorPendingSwapsEpic,
  ensureOutputBalanceEpic,
  periodicMonitorTriggerEpic,
  cleanupOutdatedSwapsEpic
);
