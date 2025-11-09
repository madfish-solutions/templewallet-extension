import retry from 'async-retry';
import { Action } from 'redux';
import { combineEpics, Epic } from 'redux-observable';
import { catchError, concat, delay, exhaustMap, filter, from, map, mergeMap, of, withLatestFrom, timer } from 'rxjs';
import { ofType } from 'ts-action-operators';

import type { RootState } from 'app/store/root-state.type';
import { toastError, toastSuccess } from 'app/toaster';
import { getEvmSwapStatus } from 'lib/apis/temple/endpoints/evm';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { fetchEvmRawBalance } from 'lib/evm/on-chain/balance';
import { fetchEvmTokenMetadataFromChain } from 'lib/evm/on-chain/metadata';
import { EvmAssetStandard } from 'lib/evm/types';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';
import { EvmNetworkEssentials } from 'temple/networks';

import { putNewEvmTokenAction } from '../assets/actions';
import { processLoadedOnchainBalancesAction } from '../balances/actions';
import { putEvmTokensMetadataAction } from '../tokens-metadata/actions';

import {
  cleanupOutdatedSwapsAction,
  incrementSwapCheckAttemptsAction,
  monitorPendingSwapsAction,
  removePendingEvmSwapAction,
  updateBalancesAfterSwapAction,
  updatePendingSwapStatusAction
} from './actions';
import { selectAllPendingSwaps } from './utils';

const MAX_ATTEMPTS = 20;
const MONITOR_INTERVAL = 10_000;
const MAX_PENDING_SWAP_AGE = 10 * 60 * 1_000; // 10 minutes

const monitorPendingSwapsEpic: Epic<Action, Action, RootState> = (action$, state$) =>
  action$.pipe(
    ofType(monitorPendingSwapsAction),
    withLatestFrom(state$),
    exhaustMap(([, state]) => {
      const pendingSwaps = selectAllPendingSwaps(state);

      if (pendingSwaps.length === 0) {
        return of();
      }

      return from(pendingSwaps).pipe(
        mergeMap(swap => {
          if (swap.status === 'DONE') {
            return of(updateBalancesAfterSwapAction(swap));
          }

          if (swap.status === 'FAILED' || swap.statusCheckAttempts >= MAX_ATTEMPTS) {
            return of(removePendingEvmSwapAction(swap.txHash));
          }

          return from(
            retry(
              async () =>
                await getEvmSwapStatus({
                  ...swap.statusCheckParams,
                  txHash: swap.txHash
                }),
              { retries: 3, minTimeout: 2_000 }
            )
          ).pipe(
            mergeMap(result => {
              const actions = [incrementSwapCheckAttemptsAction(swap.txHash)];
              const { status } = result;

              if (status === 'DONE') {
                const immediateActions = [
                  ...actions,
                  updatePendingSwapStatusAction({
                    txHash: swap.txHash,
                    status: 'DONE',
                    lastCheckedAt: Date.now()
                  }),
                  updateBalancesAfterSwapAction(swap)
                ];

                toastSuccess('Swap transaction completed', true, {
                  hash: swap.txHash,
                  blockExplorerHref: swap.blockExplorerUrl
                });

                return from(immediateActions);
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

                return concat(from(immediateActions), of(removePendingEvmSwapAction(swap.txHash)).pipe(delay(5000)));
              }

              return from(actions);
            }),
            catchError(error => {
              console.error(`Failed to check swap status ${swap.txHash}: `, error);
              return of(incrementSwapCheckAttemptsAction(swap.txHash));
            })
          );
        })
      );
    })
  );

const updateBalancesAfterSwapEpic: Epic<Action, Action, RootState> = action$ =>
  action$.pipe(
    ofType(updateBalancesAfterSwapAction),
    mergeMap(action => {
      const { txHash, accountPkh, outputTokenSlug, outputNetwork, initialInputTokenSlug, initialInputNetwork } =
        action.payload;

      return from(
        (async () => {
          const actionsToDispatch: Action[] = [];
          const now = Date.now();

          const processSingleShotBalance = async (network: EvmNetworkEssentials, slug: string) => {
            try {
              const balance = await fetchEvmRawBalance(
                network,
                slug,
                accountPkh,
                isEvmNativeTokenSlug(slug) ? EvmAssetStandard.NATIVE : EvmAssetStandard.ERC20
              );

              actionsToDispatch.push(
                processLoadedOnchainBalancesAction({
                  balances: { [slug]: balance.toFixed() },
                  timestamp: now,
                  account: accountPkh,
                  chainId: network.chainId
                })
              );
            } catch (error) {
              console.warn(`Failed to fetch balance for ${slug} on ${network.chainId}: `, error);
            }
          };

          // Deduplicate balance refreshes when both
          // networks are the same or input token is native
          const refreshItems = [
            { network: initialInputNetwork, slug: initialInputTokenSlug },
            { network: outputNetwork, slug: outputTokenSlug },
            { network: initialInputNetwork, slug: EVM_TOKEN_SLUG },
            { network: outputNetwork, slug: EVM_TOKEN_SLUG }
          ];
          const seen = new Set<string>();
          for (const { network, slug } of refreshItems) {
            const key = `${network.chainId}:${slug}`;
            if (seen.has(key)) continue;
            seen.add(key);
            await processSingleShotBalance(network, slug);
          }

          if (isEvmNativeTokenSlug(outputTokenSlug)) {
            return [...actionsToDispatch, removePendingEvmSwapAction(txHash)];
          }

          try {
            const metadata = await fetchEvmTokenMetadataFromChain(outputNetwork, outputTokenSlug);
            actionsToDispatch.push(
              putNewEvmTokenAction({
                publicKeyHash: accountPkh,
                chainId: outputNetwork.chainId,
                assetSlug: outputTokenSlug
              }),
              putEvmTokensMetadataAction({
                chainId: outputNetwork.chainId,
                records: { [outputTokenSlug]: metadata }
              }),
              removePendingEvmSwapAction(txHash)
            );

            return actionsToDispatch;
          } catch (error) {
            console.warn('Failed to ensure output token is present after successful swap: ', error);
          }

          return [removePendingEvmSwapAction(txHash), ...actionsToDispatch];
        })()
      ).pipe(
        mergeMap(actions => from(actions)),
        catchError(error => {
          console.error('Failed to update balances after successful swap: ', error);
          return of(removePendingEvmSwapAction(txHash));
        })
      );
    })
  );

const periodicMonitorTriggerEpic: Epic<Action, Action, RootState> = (_, state$) =>
  timer(100, MONITOR_INTERVAL).pipe(
    withLatestFrom(state$),
    filter(([_, state]) => {
      const pendingSwaps = selectAllPendingSwaps(state);
      return pendingSwaps.length > 0;
    }),
    map(monitorPendingSwapsAction)
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
        return from(outdatedSwaps.map(({ txHash }) => removePendingEvmSwapAction(txHash)));
      }

      return of();
    })
  );

export const pendingEvmSwapsEpics = combineEpics(
  monitorPendingSwapsEpic,
  updateBalancesAfterSwapEpic,
  periodicMonitorTriggerEpic,
  cleanupOutdatedSwapsEpic
);
