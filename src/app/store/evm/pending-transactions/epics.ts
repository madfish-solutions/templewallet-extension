import retry from 'async-retry';
import { Action } from 'redux';
import { combineEpics, Epic } from 'redux-observable';
import {
  catchError,
  concat,
  delay,
  exhaustMap,
  filter,
  from,
  map,
  mergeMap,
  of,
  withLatestFrom,
  interval,
  EMPTY
} from 'rxjs';
import { ofType } from 'ts-action-operators';
import { WaitForTransactionReceiptTimeoutError } from 'viem';

import type { RootState } from 'app/store/root-state.type';
import { toastError, toastSuccess } from 'app/toaster';
import { getEvmSwapStatus } from 'lib/apis/temple/endpoints/evm';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { fetchEvmRawBalance } from 'lib/evm/on-chain/balance';
import { fetchEvmTokenMetadataFromChain } from 'lib/evm/on-chain/metadata';
import { EvmAssetStandard } from 'lib/evm/types';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';
import { getViemPublicClient } from 'temple/evm';
import { EvmNetworkEssentials } from 'temple/networks';

import { putNewEvmTokenAction } from '../assets/actions';
import { processLoadedOnchainBalancesAction } from '../balances/actions';
import { putEvmTokensMetadataAction } from '../tokens-metadata/actions';

import {
  incrementSwapCheckAttemptsAction,
  monitorPendingSwapsAction,
  removePendingEvmSwapAction,
  updateBalancesAfterSwapAction,
  updatePendingSwapStatusAction,
  monitorPendingTransfersAction,
  updatePendingTransferStatusAction,
  updateBalancesAfterTransferAction,
  removePendingEvmTransferAction,
  cleanupOutdatedEvmPendingTxWithInitialMonitorTriggerAction,
  disableSwapCheckStatusRetriesAction,
  removePendingEvmOtherTransactionAction,
  monitorPendingOtherTransactionsAction,
  updatePendingOtherTransactionStatusAction
} from './actions';
import { selectAllPendingSwaps, selectAllPendingTransactions, selectAllPendingTransfers } from './utils';

const MAX_SWAP_STATUS_CHECK_ATTEMPTS = 50;

const LONG_MONITOR_INTERVAL = 12_000;
const SHORT_MONITOR_INTERVAL = 4_000;

const ONE_MINUTE = 60 * 1_000;
const MAX_PENDING_SWAP_AGE = 10 * ONE_MINUTE;
const MAX_PENDING_TRANSFER_AGE = 2 * ONE_MINUTE;
const MAX_PENDING_OTHER_TRANSACTION_AGE = 2 * ONE_MINUTE;

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

          if (swap.status === 'FAILED' || swap.statusCheckAttempts >= MAX_SWAP_STATUS_CHECK_ATTEMPTS) {
            return of(removePendingEvmSwapAction(swap.txHash));
          }

          const { provider, ...statusCheckParams } = swap.statusCheckParams;

          return from(
            retry(
              async () => {
                if (provider === 'lifi' || provider === undefined) {
                  return await getEvmSwapStatus({ ...statusCheckParams, txHash: swap.txHash });
                }

                const evmToolkit = getViemPublicClient(swap.initialInputNetwork);
                const result = await evmToolkit.waitForTransactionReceipt({ hash: swap.txHash });

                return {
                  status: result.status === 'success' ? 'DONE' : 'FAILED'
                };
              },
              swap.retriesEnabled ? { retries: 2, minTimeout: SHORT_MONITOR_INTERVAL } : { retries: 0 }
            )
          ).pipe(
            mergeMap(result => {
              const actions = [incrementSwapCheckAttemptsAction(swap.txHash)];
              const { status } = result;

              const commonToastParams = {
                hash: swap.txHash,
                blockExplorerHref: swap.blockExplorerUrl
              };

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

                toastSuccess('Swap completed', true, commonToastParams);

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

                toastError('Swap failed', true, commonToastParams);

                return concat(from(immediateActions), of(removePendingEvmSwapAction(swap.txHash)).pipe(delay(5000)));
              }

              return from(actions);
            }),
            catchError(error => {
              if (error?.status === 400 && swap.statusCheckAttempts > 5) {
                console.warn(`LIFI is unable to identify transaction: ${swap.txHash}, disabling additional retries`);
                return concat(
                  of(incrementSwapCheckAttemptsAction(swap.txHash)),
                  of(disableSwapCheckStatusRetriesAction(swap.txHash))
                );
              }

              console.warn(`Failed to check pending swap status ${swap.txHash}: `, error);
              return of(incrementSwapCheckAttemptsAction(swap.txHash));
            })
          );
        })
      );
    })
  );

const buildBalanceUpdateAction = async (
  network: EvmNetworkEssentials,
  slug: string,
  accountPkh: HexString,
  timestamp: number,
  standard?: EvmAssetStandard
) => {
  try {
    const balance = await fetchEvmRawBalance(network, slug, accountPkh, standard);
    return processLoadedOnchainBalancesAction({
      balances: { [slug]: balance.toFixed() },
      timestamp,
      account: accountPkh,
      chainId: network.chainId
    });
  } catch (error) {
    console.warn(`Failed to fetch balance for ${slug} on ${network.chainId}: `, error);
    return null;
  }
};

const updateBalancesAfterSwapEpic: Epic<Action, Action, RootState> = action$ =>
  action$.pipe(
    ofType(updateBalancesAfterSwapAction),
    mergeMap(action => {
      const { txHash, accountPkh, outputTokenSlug, outputNetwork, initialInputTokenSlug, initialInputNetwork } =
        action.payload;

      return from(
        (async () => {
          const now = Date.now();
          const actionsToDispatch: Action[] = [];

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
            const standard = isEvmNativeTokenSlug(slug) ? EvmAssetStandard.NATIVE : EvmAssetStandard.ERC20;
            const action = await buildBalanceUpdateAction(network, slug, accountPkh, now, standard);
            if (action) actionsToDispatch.push(action);
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

const periodicSwapMonitorTriggerEpic: Epic<Action, Action, RootState> = (_, state$) =>
  interval(LONG_MONITOR_INTERVAL).pipe(
    withLatestFrom(state$),
    filter(([_, state]) => {
      const pendingSwaps = selectAllPendingSwaps(state);
      return pendingSwaps.length > 0;
    }),
    map(monitorPendingSwapsAction)
  );

const monitorPendingTransfersEpic: Epic<Action, Action, RootState> = (action$, state$) =>
  action$.pipe(
    ofType(monitorPendingTransfersAction),
    withLatestFrom(state$),
    exhaustMap(([, state]) => {
      const pendingTransfers = selectAllPendingTransfers(state);
      if (pendingTransfers.length === 0) {
        return of();
      }

      return from(pendingTransfers).pipe(
        mergeMap(transfer => {
          if (transfer.status === 'DONE') {
            return of(updateBalancesAfterTransferAction(transfer));
          }

          if (transfer.status === 'FAILED') {
            return of(removePendingEvmTransferAction(transfer.txHash));
          }

          const client = getViemPublicClient(transfer.network);
          const commonToastParams = {
            hash: transfer.txHash,
            blockExplorerHref: transfer.blockExplorerUrl
          };

          return from(
            client.waitForTransactionReceipt({
              hash: transfer.txHash,
              pollingInterval: SHORT_MONITOR_INTERVAL,
              timeout: MAX_PENDING_TRANSFER_AGE
            })
          ).pipe(
            mergeMap(receipt => {
              const status = receipt.status === 'success' ? 'DONE' : 'FAILED';
              if (status === 'DONE') {
                toastSuccess('Transfer completed', true, commonToastParams);

                return from([
                  updatePendingTransferStatusAction({
                    txHash: transfer.txHash,
                    status: 'DONE',
                    lastCheckedAt: Date.now()
                  }),
                  updateBalancesAfterTransferAction(transfer)
                ]);
              }

              toastError('Transfer failed', true, commonToastParams);

              return concat(
                from([
                  updatePendingTransferStatusAction({
                    txHash: transfer.txHash,
                    status: 'FAILED',
                    lastCheckedAt: Date.now()
                  })
                ]),
                of(removePendingEvmTransferAction(transfer.txHash)).pipe(delay(5000))
              );
            }),
            catchError(error => {
              if (error instanceof WaitForTransactionReceiptTimeoutError) {
                console.warn(error.shortMessage);
                return of(removePendingEvmTransferAction(transfer.txHash));
              }

              toastError('Transfer failed', true, commonToastParams);

              return concat(
                from([
                  updatePendingTransferStatusAction({
                    txHash: transfer.txHash,
                    status: 'FAILED',
                    lastCheckedAt: Date.now()
                  })
                ]),
                of(removePendingEvmTransferAction(transfer.txHash)).pipe(delay(5000))
              );
            })
          );
        })
      );
    })
  );

const updateBalancesAfterTransferEpic: Epic<Action, Action, RootState> = action$ =>
  action$.pipe(
    ofType(updateBalancesAfterTransferAction),
    mergeMap(action => {
      const { txHash, accountPkh, network, assetSlug } = action.payload;

      return from(
        (async () => {
          const now = Date.now();
          const actionsToDispatch: Action[] = [];

          const refreshSlugs = new Set<string>([assetSlug, EVM_TOKEN_SLUG]);
          for (const slug of refreshSlugs) {
            const action = await buildBalanceUpdateAction(network, slug, accountPkh, now);
            if (action) actionsToDispatch.push(action);
          }

          return [...actionsToDispatch, removePendingEvmTransferAction(txHash)];
        })()
      ).pipe(
        mergeMap(actions => from(actions)),
        catchError(error => {
          console.error('Failed to update balances after successful transfer: ', error);
          return of(removePendingEvmTransferAction(action.payload.txHash));
        })
      );
    })
  );

const monitorPendingOtherTransactionsEpic: Epic<Action, Action, RootState> = (action$, state$) =>
  action$.pipe(
    ofType(monitorPendingOtherTransactionsAction),
    withLatestFrom(state$),
    mergeMap(([, state]) => {
      const pendingTransactions = selectAllPendingTransactions(state);

      return pendingTransactions.length === 0 ? EMPTY : from(pendingTransactions);
    }),
    mergeMap(transaction => {
      if (transaction.status === 'DONE') {
        return of();
      }

      if (transaction.status === 'FAILED') {
        return of(removePendingEvmOtherTransactionAction(transaction.txHash));
      }

      const client = getViemPublicClient(transaction.network);
      const commonToastParams = {
        hash: transaction.txHash,
        blockExplorerHref: transaction.blockExplorerUrl
      };

      return from(
        client.waitForTransactionReceipt({
          hash: transaction.txHash,
          pollingInterval: SHORT_MONITOR_INTERVAL,
          timeout: MAX_PENDING_OTHER_TRANSACTION_AGE
        })
      ).pipe(
        mergeMap(receipt => {
          const status = receipt.status === 'success' ? 'DONE' : 'FAILED';
          if (status === 'DONE') {
            toastSuccess('Transaction completed', true, commonToastParams);

            return of(
              updatePendingOtherTransactionStatusAction({
                txHash: transaction.txHash,
                status: 'DONE',
                lastCheckedAt: Date.now()
              })
            );
          }

          toastError('Transaction failed', true, commonToastParams);

          return concat(
            of(
              updatePendingOtherTransactionStatusAction({
                txHash: transaction.txHash,
                status: 'FAILED',
                lastCheckedAt: Date.now()
              })
            ),
            of(removePendingEvmOtherTransactionAction(transaction.txHash)).pipe(delay(5000))
          );
        }),
        catchError(error => {
          if (error instanceof WaitForTransactionReceiptTimeoutError) {
            console.warn(error.shortMessage);
            return of(removePendingEvmOtherTransactionAction(transaction.txHash));
          }

          toastError('Transaction failed', true, commonToastParams);

          return concat(
            of(
              updatePendingOtherTransactionStatusAction({
                txHash: transaction.txHash,
                status: 'FAILED',
                lastCheckedAt: Date.now()
              })
            ),
            of(removePendingEvmOtherTransactionAction(transaction.txHash)).pipe(delay(5000))
          );
        })
      );
    })
  );

const cleanupOutdatedEvmPendingTransactionsEpic: Epic<Action, Action, RootState> = (action$, state$) =>
  action$.pipe(
    ofType(cleanupOutdatedEvmPendingTxWithInitialMonitorTriggerAction),
    withLatestFrom(state$),
    mergeMap(([, state]) => {
      const pendingSwaps = selectAllPendingSwaps(state);
      const pendingTransfers = selectAllPendingTransfers(state);
      const pendingTransactions = selectAllPendingTransactions(state);
      const now = Date.now();

      const outdatedSwaps = pendingSwaps.filter(swap => now - swap.submittedAt > MAX_PENDING_SWAP_AGE);
      const outdatedTransfers = pendingTransfers.filter(tr => now - tr.submittedAt > MAX_PENDING_TRANSFER_AGE);
      const outdatedOtherTransactions = pendingTransactions.filter(
        tx => now - tx.submittedAt > MAX_PENDING_OTHER_TRANSACTION_AGE
      );

      const removalActions: Action[] = [
        ...outdatedSwaps.map(({ txHash }) => removePendingEvmSwapAction(txHash)),
        ...outdatedTransfers.map(({ txHash }) => removePendingEvmTransferAction(txHash)),
        ...outdatedOtherTransactions.map(({ txHash }) => removePendingEvmOtherTransactionAction(txHash))
      ];

      const monitorActions: Action[] = [
        monitorPendingSwapsAction(),
        monitorPendingTransfersAction(),
        monitorPendingOtherTransactionsAction()
      ];

      if (removalActions.length > 0) {
        return concat(from(removalActions), from(monitorActions));
      }

      return from(monitorActions);
    })
  );

export const pendingEvmSwapsEpics = combineEpics(
  monitorPendingSwapsEpic,
  updateBalancesAfterSwapEpic,
  periodicSwapMonitorTriggerEpic,
  monitorPendingTransfersEpic,
  updateBalancesAfterTransferEpic,
  cleanupOutdatedEvmPendingTransactionsEpic,
  monitorPendingOtherTransactionsEpic
);
