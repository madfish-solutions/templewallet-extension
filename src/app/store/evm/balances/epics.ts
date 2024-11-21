import { Epic, combineEpics } from 'redux-observable';
import { EMPTY, catchError, from, merge, mergeMap, of } from 'rxjs';
import { ofType } from 'ts-action-operators';

import { setEvmBalancesLoadingState } from '../actions';

import { loadEvmBalanceOnChainActions } from './actions';
import { RequestAlreadyPendingError, evmOnChainBalancesRequestsExecutor } from './utils';

const loadEvmBalanceOnChainEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadEvmBalanceOnChainActions.submit),
    mergeMap(({ payload }) => {
      const { network, assetSlug, account } = payload;

      return from(evmOnChainBalancesRequestsExecutor.executeRequest(payload)).pipe(
        mergeMap(balance =>
          merge(
            of(loadEvmBalanceOnChainActions.success({ network, assetSlug, account, balance })),
            of(setEvmBalancesLoadingState({ chainId: network.chainId, isLoading: false }))
          )
        ),
        catchError(error =>
          error instanceof RequestAlreadyPendingError ? EMPTY : of(loadEvmBalanceOnChainActions.fail(error.message))
        )
      );
    })
  );

export const evmBalancesEpics = combineEpics(loadEvmBalanceOnChainEpic);
