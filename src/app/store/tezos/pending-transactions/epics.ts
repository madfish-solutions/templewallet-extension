import { Action } from 'redux';
import { Epic, combineEpics } from 'redux-observable';
import {
  BehaviorSubject,
  EMPTY,
  catchError,
  concat,
  delay,
  exhaustMap,
  forkJoin,
  from,
  mergeMap,
  of,
  withLatestFrom
} from 'rxjs';
import { ofType } from 'ts-action-operators';

import { RootState } from 'app/store/root-state.type';
import { fetchGetOperationsByHash, isKnownChainId } from 'lib/apis/tzkt';
import { refetchOnce429 } from 'lib/apis/utils';
import { TEZOS_BLOCK_DURATION } from 'lib/fixed-times';
import {
  TEZOS_OPERATION_NOT_CONFIRMED_ERROR_MSG,
  confirmTezosOperation,
  getTezosReadOnlyRpcClient
} from 'temple/tezos';

import {
  cleanupOutdatedTezosPendingTxWithInitialMonitorTriggerAction,
  monitorPendingTezosTransactionsAction,
  removePendingTezosTransactionsAction,
  updatePendingTezosTransactionStatusAction
} from './actions';
import { TransactionState } from './state';
import { selectAllPendingTezosTransactions } from './utils';

const MAX_PENDING_TRANSACTION_AGE = 60_000;

const txDoneAction$ = (txHash: string, lastCheckedAt: number) =>
  of(updatePendingTezosTransactionStatusAction({ txHash, status: 'DONE', lastCheckedAt }));

const txFailedAction$ = (txHash: string, lastCheckedAt: number) =>
  concat(
    from([updatePendingTezosTransactionStatusAction({ txHash, status: 'FAILED', lastCheckedAt })]),
    of(removePendingTezosTransactionsAction([txHash])).pipe(delay(5000))
  );

const pollForPendingTransaction$ = <T>(
  intervalDuration: number,
  submittedAt: number,
  txHash: string,
  getResultValue: () => Promise<T>,
  getNewStatus: (result: T) => TransactionState['status']
) => {
  const intervalSignals$ = new BehaviorSubject(true);
  const interval = setInterval(() => intervalSignals$.next(true), intervalDuration);

  return intervalSignals$.pipe(
    exhaustMap(() => forkJoin([of(Date.now()), getResultValue()])),
    mergeMap(([lastCheckedAt, result]) => {
      const isWaitingTooLong = lastCheckedAt - submittedAt > MAX_PENDING_TRANSACTION_AGE;

      switch (getNewStatus(result)) {
        case 'DONE':
          clearInterval(interval);

          return txDoneAction$(txHash, lastCheckedAt);
        case 'FAILED':
          clearInterval(interval);

          return txFailedAction$(txHash, lastCheckedAt);
        default:
          if (isWaitingTooLong) {
            clearInterval(interval);

            return of(removePendingTezosTransactionsAction([txHash]));
          }

          return EMPTY;
      }
    }),
    catchError(error => {
      console.error(error);

      return EMPTY;
    })
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
      const { network, status, txHash, submittedAt } = transaction;
      const { chainId } = network;
      switch (status) {
        case 'DONE':
          return EMPTY;
        case 'FAILED':
          return of(removePendingTezosTransactionsAction([transaction.txHash]));
        default:
          if (isKnownChainId(chainId)) {
            return pollForPendingTransaction$(
              TEZOS_BLOCK_DURATION,
              submittedAt,
              txHash,
              () => refetchOnce429(() => fetchGetOperationsByHash(chainId, transaction.txHash)),
              operations => {
                if (operations.length === 0) {
                  return 'PENDING';
                }

                return operations.some(operation => operation.status === 'failed') ? 'FAILED' : 'DONE';
              }
            );
          }

          return from(confirmTezosOperation(getTezosReadOnlyRpcClient(network), txHash)).pipe(
            mergeMap(() => txDoneAction$(txHash, Date.now())),
            catchError(error => {
              if (error instanceof Error && error.message === TEZOS_OPERATION_NOT_CONFIRMED_ERROR_MSG) {
                return txFailedAction$(txHash, Date.now());
              }

              return of(removePendingTezosTransactionsAction([txHash]));
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
