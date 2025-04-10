import { PayloadAction } from '@reduxjs/toolkit';
import { Epic, combineEpics } from 'redux-observable';
import { /* EMPTY, bufferTime, */ catchError, /* forkJoin, */ from, merge, mergeMap, of, switchMap } from 'rxjs';
import { ofType } from 'ts-action-operators';

import { evmOnChainBalancesRequestsExecutor } from 'lib/evm/on-chain/balance';
import { RequestAlreadyPendingError } from 'lib/evm/on-chain/utils/evm-rpc-requests-executor';
import { isTruthy } from 'lib/utils';
// import { serializeError } from 'lib/utils/serialize-error';

import { setEvmBalancesLoadingState } from '../actions';

import {
  loadEvmBalanceOnChainActions
  // loadManyEvmBalancesOnChainActions,
  // processLoadedOnchainBalancesAction
} from './actions';

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
      console.log(`Loading ${assetSlug} balance for ${account} on chain ${chainId}`, new Date().toTimeString());

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

/* const loadManyEvmBalancesOnChainEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadManyEvmBalancesOnChainActions.submit),
    mergeMap(({ payload }) => {
      const { network, assets, account, throwOnTimeout } = payload;
      const { chainId } = network;
      const updateTs = Date.now();

      if (assets.length === 0) {
        return of(loadManyEvmBalancesOnChainActions.success({ network, account }));
      }

      let firstError: unknown;

      return from(assets).pipe(
        mergeMap(asset =>
          from(
            evmOnChainBalancesRequestsExecutor
              .executeRequest({ network, account, throwOnTimeout, ...asset })
              .then(balance => [asset.assetSlug, balance.toFixed()] as const)
              .catch(error => {
                if (!firstError) {
                  firstError = error;
                }

                return [asset.assetSlug, undefined] as const;
              })
          )
        ),
        bufferTime(1000),
        mergeMap(results =>
          forkJoin([
            of(results.filter((entry): entry is [string, string] => entry[1] !== undefined)),
            evmOnChainBalancesRequestsExecutor.poolIsEmpty(chainId)
          ])
        ),
        mergeMap(([successfulResultEntries, poolIsEmpty]) =>
          merge(
            successfulResultEntries.length > 0
              ? of(
                  processLoadedOnchainBalancesAction({
                    chainId,
                    account,
                    balances: Object.fromEntries(successfulResultEntries),
                    timestamp: updateTs
                  })
                )
              : EMPTY,
            poolIsEmpty && firstError
              ? of(
                  loadManyEvmBalancesOnChainActions.fail({
                    error: serializeError(firstError) ?? 'Unknown error',
                    network,
                    account
                  })
                )
              : EMPTY,
            poolIsEmpty && !firstError ? of(loadManyEvmBalancesOnChainActions.success({ account, network })) : EMPTY
          )
        )
      );
    })
  ); */

export const evmBalancesEpics = combineEpics(loadEvmBalanceOnChainEpic /*, loadManyEvmBalancesOnChainEpic */);
