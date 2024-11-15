import { Epic, combineEpics } from 'redux-observable';
import { EMPTY, catchError, from, map, mergeMap, of } from 'rxjs';
import { ofType } from 'ts-action-operators';

import { loadEvmBalanceOnChainActions } from './actions';
import { RequestAlreadyPendingError, evmOnChainBalancesRequestsExecutor } from './utils';

const loadEvmBalanceOnChainEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadEvmBalanceOnChainActions.submit),
    mergeMap(({ payload }) => {
      const { network, assetSlug, account } = payload;

      return from(evmOnChainBalancesRequestsExecutor.executeRequest(payload)).pipe(
        map(balance => loadEvmBalanceOnChainActions.success({ network, assetSlug, account, balance })),
        catchError(error =>
          error instanceof RequestAlreadyPendingError ? EMPTY : of(loadEvmBalanceOnChainActions.fail(error.message))
        )
      );
    })
  );

export const evmBalancesEpics = combineEpics(loadEvmBalanceOnChainEpic);
