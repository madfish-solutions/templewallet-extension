import { TezosToolkit } from '@taquito/taquito';
import { BigNumber } from 'bignumber.js';
import { combineEpics, Epic } from 'redux-observable';
import { catchError, forkJoin, from, map, Observable, of, switchMap } from 'rxjs';
import { Action } from 'ts-action';
import { ofType, toPayload } from 'ts-action-operators';

import { fecthTezosBalanceFromTzkt, fetchAllTokensBalancesFromTzkt } from 'lib/apis/tzkt/api';
import { TEZ_TOKEN_SLUG, toAssetSlug } from 'lib/assets';
import { fetchBalanceAtomic, fetchTezosBalanceAtomic } from 'lib/balances';
import { atomsToTokens } from 'lib/temple/helpers';
import { IAccountToken } from 'lib/temple/repo';

import { loadTokensBalancesFromChainAction, loadTokensBalancesFromTzktAction } from './actions';

const YUPANA_TOKENS = [
  'KT1Rk86CX85DjBKmuyBhrCyNsHyudHVtASec_0',
  'KT1Rk86CX85DjBKmuyBhrCyNsHyudHVtASec_2',
  'KT1Rk86CX85DjBKmuyBhrCyNsHyudHVtASec_3',
  'KT1Rk86CX85DjBKmuyBhrCyNsHyudHVtASec_4',
  'KT1Rk86CX85DjBKmuyBhrCyNsHyudHVtASec_5',
  'KT1Rk86CX85DjBKmuyBhrCyNsHyudHVtASec_6'
];
const YUPANA_MULTIPLIER = 18;

const fetchTokensBalances$ = (apiUrl: string, account: string) =>
  forkJoin([fecthTezosBalanceFromTzkt(apiUrl, account), fetchAllTokensBalancesFromTzkt(apiUrl, account)]);

const loadTokensBalancesFromTzktEpic: Epic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadTokensBalancesFromTzktAction.submit),
    toPayload(),
    switchMap(({ apiUrl, publicKeyHash, chainId }) =>
      fetchTokensBalances$(apiUrl, publicKeyHash).pipe(
        map(([tezosBalances, tokensBalances]) => {
          const balances: Record<string, string> = {
            tez: new BigNumber(tezosBalances.balance ?? 0).minus(tezosBalances.frozenDeposit ?? 0).toFixed()
          };

          tokensBalances.forEach(({ token, balance }) => {
            balances[toAssetSlug(token.contract.address, token.tokenId)] = balance;
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

const fetchTokensBalancesFromChain = async (tokens: Array<IAccountToken>, rpcUrl: string, publicKeyHash: string) => {
  const tezos = new TezosToolkit(rpcUrl);

  const balances: Record<string, string> = {};

  for (const { tokenSlug } of tokens) {
    const balance = await fetchBalanceAtomic(tezos, tokenSlug, publicKeyHash);
    balances[tokenSlug] = balance.toFixed();
  }

  const tezosBalance = await fetchTezosBalanceAtomic(tezos, publicKeyHash);
  balances[TEZ_TOKEN_SLUG] = tezosBalance.toFixed();

  return balances;
};

const loadTokensBalancesFromChainEpic: Epic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadTokensBalancesFromChainAction.submit),
    toPayload(),
    switchMap(({ rpcUrl, tokens, publicKeyHash, chainId }) =>
      from(fetchTokensBalancesFromChain(tokens, rpcUrl, publicKeyHash)).pipe(
        map(balances => loadTokensBalancesFromChainAction.success({ publicKeyHash, chainId, balances })),
        catchError(err => of(loadTokensBalancesFromChainAction.fail(err.message)))
      )
    )
  );

export const balancesEpics = combineEpics(loadTokensBalancesFromTzktEpic, loadTokensBalancesFromChainEpic);
