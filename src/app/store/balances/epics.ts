import { BigNumber } from 'bignumber.js';
import { combineEpics, Epic } from 'redux-observable';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { Action } from 'ts-action';
import { ofType, toPayload } from 'ts-action-operators';

import { fecthTezosBalanceFromTzkt, fetchAllAssetsBalancesFromTzkt } from 'lib/apis/tzkt/api';
import { TEZ_TOKEN_SLUG } from 'lib/assets';

import { loadTokensBalancesFromTzktAction } from './actions';
import { fixBalances } from './utils';

const loadTokensBalancesFromTzktEpic: Epic<Action> = action$ =>
  action$.pipe(
    ofType(loadTokensBalancesFromTzktAction.submit),
    toPayload(),
    switchMap(({ publicKeyHash, chainId, gasOnly }) =>
      forkJoin([
        fecthTezosBalanceFromTzkt(publicKeyHash, chainId),
        gasOnly ? of(undefined) : fetchAllAssetsBalancesFromTzkt(publicKeyHash, chainId)
      ]).pipe(
        map(([tezosBalances, balances]) => {
          if (balances) fixBalances(balances);
          else balances = {};

          balances[TEZ_TOKEN_SLUG] = new BigNumber(tezosBalances.balance ?? 0)
            .minus(tezosBalances.frozenDeposit ?? 0)
            .toFixed();

          return loadTokensBalancesFromTzktAction.success({ publicKeyHash, chainId, balances });
        }),
        catchError(err => of(loadTokensBalancesFromTzktAction.fail(err.message)))
      )
    )
  );

export const balancesEpics = combineEpics(loadTokensBalancesFromTzktEpic);
