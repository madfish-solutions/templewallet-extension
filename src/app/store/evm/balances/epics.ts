import { PayloadAction } from '@reduxjs/toolkit';
import { Epic, combineEpics } from 'redux-observable';
import { catchError, from, merge, mergeMap, of, switchMap } from 'rxjs';
import { ofType } from 'ts-action-operators';

import { evmOnChainBalancesRequestsExecutor } from 'lib/evm/on-chain/balance';
import { RequestAlreadyPendingError } from 'lib/evm/on-chain/utils/evm-rpc-requests-executor';
import { isTruthy } from 'lib/utils';

import { setEvmBalancesLoadingState } from '../actions';

import { loadEvmBalanceOnChainActions } from './actions';

const withLoadingStateUpdate =
  <T>(chainId: number, valueActionFn: (value: T) => PayloadAction<unknown> | nullish) =>
  (value: T) =>
    from(evmOnChainBalancesRequestsExecutor.poolIsEmpty(chainId)).pipe(
      switchMap(poolIsEmpty => {
        const mainAction = valueActionFn(value);

        return merge(
          ...[
            mainAction,
            (!mainAction || mainAction.type !== setEvmBalancesLoadingState.type) && poolIsEmpty
              ? setEvmBalancesLoadingState({ chainId, isLoading: false, source: 'onchain' })
              : null
          ]
            .filter(isTruthy)
            .map(action => of(action))
        );
      })
    );

const loadEvmBalanceOnChainEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadEvmBalanceOnChainActions.submit),
    mergeMap(({ payload }) => {
      const { network, assetSlug, account } = payload;
      const { chainId } = network;
      const updateTs = Date.now();

      return from(evmOnChainBalancesRequestsExecutor.executeRequest(payload)).pipe(
        switchMap(
          withLoadingStateUpdate(chainId, balance =>
            loadEvmBalanceOnChainActions.success({ network, assetSlug, account, balance, timestamp: updateTs })
          )
        ),
        catchError(
          withLoadingStateUpdate(chainId, error =>
            error instanceof RequestAlreadyPendingError
              ? null
              : setEvmBalancesLoadingState({
                  error: error.message,
                  chainId: network.chainId,
                  isLoading: false,
                  source: 'onchain'
                })
          )
        )
      );
    })
  );

export const evmBalancesEpics = combineEpics(loadEvmBalanceOnChainEpic);
