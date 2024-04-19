import { combineEpics, Epic } from 'redux-observable';
import { catchError, from, map, of, switchMap } from 'rxjs';
import { ofType, toPayload } from 'ts-action-operators';

import { fetchTezosBalanceFromTzkt, fetchAllAssetsBalancesFromTzkt } from 'lib/apis/tzkt';

import { loadGasBalanceActions, loadAssetsBalancesActions } from './actions';
import { fixBalances } from './utils';

const loadGasBalanceEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadGasBalanceActions.submit),
    toPayload(),
    switchMap(({ publicKeyHash, chainId }) =>
      from(fetchTezosBalanceFromTzkt(publicKeyHash, chainId)).pipe(
        map(balance =>
          loadGasBalanceActions.success({
            publicKeyHash,
            chainId,
            balance
          })
        ),
        catchError(err => of(loadGasBalanceActions.fail(err.message)))
      )
    )
  );

const loadAssetsBalancesEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadAssetsBalancesActions.submit),
    toPayload(),
    switchMap(({ publicKeyHash, chainId }) =>
      from(fetchAllAssetsBalancesFromTzkt(publicKeyHash, chainId)).pipe(
        map(balances => {
          fixBalances(balances);

          return loadAssetsBalancesActions.success({
            publicKeyHash,
            chainId,
            balances
          });
        }),
        catchError(err => of(loadAssetsBalancesActions.fail(err.message)))
      )
    )
  );

export const balancesEpics = combineEpics(loadGasBalanceEpic, loadAssetsBalancesEpic);
