import { capitalize } from 'lodash';
import { Action } from 'redux';
import { Epic, combineEpics } from 'redux-observable';
import {
  EMPTY,
  NEVER,
  catchError,
  concat,
  delay,
  exhaustMap,
  from,
  map,
  mergeMap,
  of,
  race,
  withLatestFrom
} from 'rxjs';
import { ofType } from 'ts-action-operators';

import { RootState } from 'app/store/root-state.type';
import { toastError, toastSuccess } from 'app/toaster';
import { fetchGetOperationsByHash, isKnownChainId } from 'lib/apis/tzkt';
import { refetchOnce429 } from 'lib/apis/utils';
import { TempleTezosChainId } from 'lib/temple/types';
import {
  TEZOS_OPERATION_NOT_CONFIRMED_ERROR_MSG,
  confirmTezosOperation,
  getTezosReadOnlyRpcClient,
  loadTezosNetworkTiming
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

type TxStatusInput = Pick<TransactionState, 'network' | 'txHash' | 'startingBlockHash'>;

const getRpcTxStatus$ = ({ network, txHash, startingBlockHash }: TxStatusInput) =>
  from(loadTezosNetworkTiming(network)).pipe(
    mergeMap(({ confirmationTimeoutMs }) =>
      confirmTezosOperation(getTezosReadOnlyRpcClient(network), txHash, {
        startingBlockHash,
        timeoutMs: confirmationTimeoutMs
      })
    ),
    map((): PendingTransactionStatus => 'DONE'),
    catchError(error =>
      of<PendingTransactionStatus>(
        error instanceof Error && error.message === TEZOS_OPERATION_NOT_CONFIRMED_ERROR_MSG ? 'FAILED' : 'PENDING'
      )
    )
  );

const getTzktTxStatus$ = (chainId: TempleTezosChainId, txHash: string) =>
  from(refetchOnce429(() => fetchGetOperationsByHash(chainId, txHash))).pipe(
    mergeMap(operations => {
      if (operations.length === 0) return NEVER;

      return of<PendingTransactionStatus>(
        operations.some(operation => operation.status === 'failed') ? 'FAILED' : 'DONE'
      );
    }),
    catchError(() => NEVER)
  );

type HandleTxStatusInput = Pick<
  TransactionState,
  'txHash' | 'lastCheckedAt' | 'blockExplorerUrl' | 'kind' | 'silent'
> & {
  transactionBeingWatched?: boolean;
};

const txDoneAction$ = ({
  txHash,
  lastCheckedAt,
  blockExplorerUrl,
  kind = 'transaction',
  transactionBeingWatched,
  silent
}: HandleTxStatusInput) => {
  if (!transactionBeingWatched && !silent && kind !== 'delegation') {
    toastSuccess(capitalize(`${kind} completed`), true, { hash: txHash, blockExplorerHref: blockExplorerUrl });
  }

  return of(updatePendingTezosTransactionStatusAction({ txHash, status: 'DONE', lastCheckedAt }));
};

const txFailedAction$ = ({
  txHash,
  lastCheckedAt,
  blockExplorerUrl,
  kind = 'transaction',
  transactionBeingWatched,
  silent
}: HandleTxStatusInput) => {
  if (!transactionBeingWatched && !silent && kind !== 'delegation') {
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
      const { network, status, txHash, blockExplorerUrl, kind, silent } = transaction;
      const { chainId } = network;
      switch (status) {
        case 'DONE':
          return EMPTY;
        case 'FAILED':
          return of(removePendingTezosTransactionsAction([transaction.txHash]));
        default: {
          const lastCheckedAt = Date.now();
          const rpcStatus$ = getRpcTxStatus$(transaction);
          const status$ = isKnownChainId(chainId) ? race(getTzktTxStatus$(chainId, txHash), rpcStatus$) : rpcStatus$;

          return status$.pipe(
            withLatestFrom(state$),
            mergeMap(([status, state]) => {
              const transactionBeingWatched = state.pendingTezosTransactions?.transactionBeingWatched === txHash;
              const handleTxStatusInput = {
                txHash,
                lastCheckedAt,
                blockExplorerUrl,
                kind,
                transactionBeingWatched,
                silent
              };
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
