import { TezosToolkit } from '@taquito/taquito';
import { BigNumber } from 'bignumber.js';
import { combineEpics, Epic } from 'redux-observable';
import { catchError, forkJoin, from, map, Observable, of, switchMap } from 'rxjs';
import { Action } from 'ts-action';
import { ofType, toPayload } from 'ts-action-operators';

import { fecthTezosBalanceFromTzkt, fetchAllTokensBalancesFromTzkt } from 'lib/apis/tzkt/api';
import { fetchBalance, fetchTezosBalanceAtomic, toTokenSlug } from 'lib/temple/assets';
import { atomsToTokens } from 'lib/temple/helpers';
import { IAccountToken } from 'lib/temple/repo';

import { loadTokensBalancesFromChainAction, loadTokensBalancesFromTzktAction } from './actions';

const YUPANA_TOKENS = [
  'KT1Rk86CX85DjBKmuyBhrCyNsHyudHVtASec_4',
  'KT1Rk86CX85DjBKmuyBhrCyNsHyudHVtASec_0',
  'KT1Rk86CX85DjBKmuyBhrCyNsHyudHVtASec_5'
];
const YUPANA_MULTIPLIER = 18;

const fetchTokensBalances$ = (apiUrl: string, account: string) =>
  forkJoin([fecthTezosBalanceFromTzkt(apiUrl, account), fetchAllTokensBalancesFromTzkt(apiUrl, account)]);

const loadTokensBalancesFromTzktEpic: Epic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadTokensBalancesFromTzktAction.submit),
    toPayload(),
    switchMap(({ apiUrl, accountPublicKeyHash }) =>
      fetchTokensBalances$(apiUrl, accountPublicKeyHash).pipe(
        map(([tezosBalances, tokensBalances]) => {
          const balances: Record<string, string> = {
            tez: new BigNumber(tezosBalances.balance ?? 0).minus(tezosBalances.frozenDeposit ?? 0).toFixed()
          };

          tokensBalances.forEach(({ token, balance }) => {
            balances[toTokenSlug(token.contract.address, token.tokenId)] = balance;
          });

          for (const slug of YUPANA_TOKENS) {
            balances[slug] = atomsToTokens(new BigNumber(balances[slug]), YUPANA_MULTIPLIER).toFixed();
          }

          return loadTokensBalancesFromTzktAction.success(balances);
        }),
        catchError(err => of(loadTokensBalancesFromTzktAction.fail(err.message)))
      )
    )
  );

const fetchTokensBalancesFromChain = async (tokens: Array<IAccountToken>, rpcUrl: string, publicKeyHash: string) => {
  const tezos = new TezosToolkit(rpcUrl);

  const balances: Record<string, string> = {};

  const tokenBalancesPromise = tokens.map(async ({ tokenSlug }) => await fetchBalance(tezos, tokenSlug, publicKeyHash));
  const [tezosBalance, ...tokensBalancesResolved] = await Promise.all([
    fetchTezosBalanceAtomic(tezos, publicKeyHash),
    ...tokenBalancesPromise
  ]);

  tokensBalancesResolved.forEach((balance, index) => {
    const { tokenSlug } = tokens[index];
    balances[tokenSlug] = balance.toFixed();
  });

  balances.tez = tezosBalance.toFixed();

  return balances;
};

const loadTokensBalancesFromChainEpic: Epic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadTokensBalancesFromChainAction.submit),
    toPayload(),
    switchMap(({ rpcUrl, tokens, accountPublicKeyHash }) =>
      from(fetchTokensBalancesFromChain(tokens, rpcUrl, accountPublicKeyHash)).pipe(
        map(tokensBalances => loadTokensBalancesFromChainAction.success(tokensBalances)),
        catchError(err => of(loadTokensBalancesFromChainAction.fail(err.message)))
      )
    )
  );

export const balancesEpics = combineEpics(loadTokensBalancesFromTzktEpic, loadTokensBalancesFromChainEpic);
