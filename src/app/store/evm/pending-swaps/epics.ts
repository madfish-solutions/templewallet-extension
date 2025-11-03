import retry from 'async-retry';
import { Action } from 'redux';
import { Epic, combineEpics } from 'redux-observable';
import { catchError, concat, delay, filter, from, map, mergeMap, of, repeat, switchMap, withLatestFrom } from 'rxjs';
import { ofType } from 'ts-action-operators';

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
  removePendingEvmSwapAction,
  ensureOutputBalanceAction
} from './actions';
import { selectAllPendingSwaps } from './selectors';

const MONITOR_INTERVAL = 10_000; // 10 seconds
const MAX_CHECK_ATTEMPTS = 100; // Stop checking after ~16 minutes
const MAX_BALANCE_ATTEMPTS = 20;
const BALANCE_CHECK_INTERVAL = 3000;

const monitorPendingSwapsEpic: Epic<Action, Action, RootState> = (action$, state$) =>
  action$.pipe(
    ofType(monitorPendingSwapsAction),
    withLatestFrom(state$),
    switchMap(([, state]) => {
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

              if (result.status === 'DONE') {
                return from([
                  ...actions,
                  updatePendingSwapStatusAction({
                    txHash: swap.txHash,
                    status: 'done',
                    lastCheckedAt: Date.now()
                  }),
                  ensureOutputBalanceAction({ swap })
                ]);
              }

              if (result.status === 'FAILED') {
                const immediateActions = [
                  ...actions,
                  updatePendingSwapStatusAction({
                    txHash: swap.txHash,
                    status: 'failed',
                    lastCheckedAt: Date.now()
                  })
                ];

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

          if (isEvmNativeTokenSlug(swap.outputTokenSlug)) {
            return [removePendingEvmSwapAction({ txHash: swap.txHash })];
          }

          if (!outputNetwork) {
            console.error('Output network not found');
            return [removePendingEvmSwapAction({ txHash: swap.txHash })];
          }

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
            await new Promise(resolve => setTimeout(resolve, BALANCE_CHECK_INTERVAL));
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
  of(null).pipe(
    delay(MONITOR_INTERVAL),
    repeat(),
    withLatestFrom(state$),
    filter(([, state]) => {
      const pendingSwaps = selectAllPendingSwaps(state);
      return pendingSwaps.length > 0;
    }),
    map(() => monitorPendingSwapsAction())
  );

export const pendingEvmSwapsEpics = combineEpics(
  monitorPendingSwapsEpic,
  ensureOutputBalanceEpic,
  periodicMonitorTriggerEpic
);
