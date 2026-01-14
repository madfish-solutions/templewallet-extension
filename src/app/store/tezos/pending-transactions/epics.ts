import { capitalize } from 'lodash';
import { Action } from 'redux';
import { Epic, combineEpics } from 'redux-observable';
import { EMPTY, concat, delay, exhaustMap, from, mergeMap, of, withLatestFrom } from 'rxjs';
import { ofType } from 'ts-action-operators';

import { RootState } from 'app/store/root-state.type';
import { toastError, toastSuccess } from 'app/toaster';
import { fetchGetOperationsByHash, isKnownChainId } from 'lib/apis/tzkt';
import { refetchOnce429 } from 'lib/apis/utils';
import {
  TEZOS_OPERATION_NOT_CONFIRMED_ERROR_MSG,
  confirmTezosOperation,
  getTezosReadOnlyRpcClient
} from 'temple/tezos';
import { PendingTransactionStatus } from 'temple/types';

import {
  cleanupOutdatedTezosPendingTxWithInitialMonitorTriggerAction,
  monitorPendingTezosTransactionsAction,
  removePendingTezosTransactionsAction,
  updatePendingTezosTransactionStatusAction
} from './actions';
import { TransactionState } from './state';
import { selectAllPendingTezosTransactions } from './utils';

const MAX_PENDING_TRANSACTION_AGE = 60_000;

type HandleTxStatusInput = Pick<TransactionState, 'txHash' | 'lastCheckedAt' | 'blockExplorerUrl' | 'kind'> & {
  transactionBeingWatched?: boolean;
};

const txDoneAction$ = ({
  txHash,
  lastCheckedAt,
  blockExplorerUrl,
  kind = 'transaction',
  transactionBeingWatched
}: HandleTxStatusInput) => {
  if (!transactionBeingWatched) {
    toastSuccess(capitalize(`${kind} completed`), true, { hash: txHash, blockExplorerHref: blockExplorerUrl });
  }

  return of(updatePendingTezosTransactionStatusAction({ txHash, status: 'DONE', lastCheckedAt }));
};

const txFailedAction$ = ({
  txHash,
  lastCheckedAt,
  blockExplorerUrl,
  kind = 'transaction',
  transactionBeingWatched
}: HandleTxStatusInput) => {
  if (!transactionBeingWatched) {
    toastError(capitalize(`${kind} failed`), true, { hash: txHash, blockExplorerHref: blockExplorerUrl });
  }

  return concat(
    from([updatePendingTezosTransactionStatusAction({ txHash, status: 'FAILED', lastCheckedAt })]),
    of(removePendingTezosTransactionsAction([txHash])).pipe(delay(5000))
  );
};

const monitorPendingTransactionsEpic: Epic<Action, Action, RootState> = (action$, state$) =>
  action$.pipe(
    ofType(monitorPendingTezosTransactionsAction),
    withLatestFrom(state$),
    exhaustMap(([, state]) => {
      const pendingTransactions = selectAllPendingTezosTransactions(state);

      return pendingTransactions.length === 0 ? EMPTY : from(pendingTransactions);
    }),
    mergeMap(transaction => {
      const { network, status, txHash, blockExplorerUrl, kind } = transaction;
      const { chainId } = network;
      switch (status) {
        case 'DONE':
          return EMPTY;
        case 'FAILED':
          return of(removePendingTezosTransactionsAction([transaction.txHash]));
        default:
          const lastCheckedAt = Date.now();

          return from(
            new Promise<PendingTransactionStatus>(resolve => {
              if (isKnownChainId(chainId)) {
                refetchOnce429(() => fetchGetOperationsByHash(chainId, transaction.txHash)).then(
                  operations =>
                    void (
                      operations.length > 0 &&
                      resolve(operations.some(operation => operation.status === 'failed') ? 'FAILED' : 'DONE')
                    )
                );
              }

              confirmTezosOperation(getTezosReadOnlyRpcClient(network), txHash)
                .then(() => resolve('DONE'))
                .catch(error =>
                  resolve(
                    error instanceof Error && error.message === TEZOS_OPERATION_NOT_CONFIRMED_ERROR_MSG
                      ? 'FAILED'
                      : 'PENDING'
                  )
                );
            })
          ).pipe(
            withLatestFrom(state$),
            mergeMap(([status, state]) => {
              const transactionBeingWatched = state.pendingTezosTransactions?.transactionBeingWatched === txHash;
              const handleTxStatusInput = { txHash, lastCheckedAt, blockExplorerUrl, kind, transactionBeingWatched };
              switch (status) {
                case 'PENDING':
                  return of(removePendingTezosTransactionsAction([txHash]));
                case 'FAILED':
                  return txFailedAction$(handleTxStatusInput);
                default:
                  return txDoneAction$(handleTxStatusInput);
              }
            })
          );
      }
    })
  );

const cleanupOutdatedTezosPendingTransactionsEpic: Epic<Action, Action, RootState> = (action$, state$) =>
  action$.pipe(
    ofType(cleanupOutdatedTezosPendingTxWithInitialMonitorTriggerAction),
    withLatestFrom(state$),
    mergeMap(([, state]) => {
      const pendingTransactions = selectAllPendingTezosTransactions(state);
      const now = Date.now();

      const outdatedTxHashes = pendingTransactions
        .filter(tx => now - tx.submittedAt > MAX_PENDING_TRANSACTION_AGE)
        .map(tx => tx.txHash);

      return outdatedTxHashes.length > 0
        ? of(removePendingTezosTransactionsAction(outdatedTxHashes))
        : of(monitorPendingTezosTransactionsAction());
    })
  );

export const pendingTezosTransactionsEpics = combineEpics(
  monitorPendingTransactionsEpic,
  cleanupOutdatedTezosPendingTransactionsEpic
);
