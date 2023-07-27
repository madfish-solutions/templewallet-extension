import { BigNumber } from 'bignumber.js';
import { combineEpics, Epic } from 'redux-observable';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { Action } from 'ts-action';
import { ofType, toPayload } from 'ts-action-operators';

import { fecthTezosBalanceFromTzkt, fetchAllTokensBalancesFromTzkt } from 'lib/apis/tzkt/api';
import { TEZ_TOKEN_SLUG, toTokenSlug } from 'lib/assets';
import { atomsToTokens } from 'lib/temple/helpers';

import { loadTokensBalancesFromTzktAction } from './actions';

const YUPANA_TOKENS = [
  'KT1Rk86CX85DjBKmuyBhrCyNsHyudHVtASec_0',
  'KT1Rk86CX85DjBKmuyBhrCyNsHyudHVtASec_2',
  'KT1Rk86CX85DjBKmuyBhrCyNsHyudHVtASec_3',
  'KT1Rk86CX85DjBKmuyBhrCyNsHyudHVtASec_4',
  'KT1Rk86CX85DjBKmuyBhrCyNsHyudHVtASec_5',
  'KT1Rk86CX85DjBKmuyBhrCyNsHyudHVtASec_6'
];
const YUPANA_MULTIPLIER = 18;

const fetchTokensBalances$ = (account: string, chainId: string) =>
  forkJoin([fecthTezosBalanceFromTzkt(account, chainId), fetchAllTokensBalancesFromTzkt(account, chainId)]);

const loadTokensBalancesFromTzktEpic: Epic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadTokensBalancesFromTzktAction.submit),
    toPayload(),
    switchMap(({ publicKeyHash, chainId }) =>
      fetchTokensBalances$(publicKeyHash, chainId).pipe(
        map(([tezosBalances, tokensBalances]) => {
          const balances: Record<string, string> = {
            [TEZ_TOKEN_SLUG]: new BigNumber(tezosBalances.balance ?? 0)
              .minus(tezosBalances.frozenDeposit ?? 0)
              .toFixed()
          };

          tokensBalances.forEach(({ token, balance }) => {
            balances[toTokenSlug(token.contract.address, token.tokenId)] = balance;
          });

          for (const slug of YUPANA_TOKENS) {
            balances[slug] = atomsToTokens(new BigNumber(balances[slug]), YUPANA_MULTIPLIER).toFixed();
          }

          return loadTokensBalancesFromTzktAction.success({ publicKeyHash, chainId, balances });
        }),
        catchError(err => of(loadTokensBalancesFromTzktAction.fail(err.message)))
      )
    )
  );

export const balancesEpics = combineEpics(loadTokensBalancesFromTzktEpic);
