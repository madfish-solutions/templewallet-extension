import { combineEpics } from 'redux-observable';
import { forkJoin, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Action } from 'ts-action';
import { ofType, toPayload } from 'ts-action-operators';

import { RootState } from '..';
import { loadTokensApyActions } from './actions';
import {
  fetchTzBtcApy$,
  fetchKUSDApy$,
  fetchUSDTApy$,
  fetchUUSDCApr$,
  fetchUBTCApr$,
  fetchYOUApr$,
  withUsdToTokenRates
} from './utils';

const loadTokensApyEpic = (action$: Observable<Action>, state$: Observable<RootState>) =>
  action$.pipe(
    ofType(loadTokensApyActions.submit),
    toPayload(),
    withUsdToTokenRates(state$),
    switchMap(([tezos, tokenUsdExchangeRates]) =>
      forkJoin([
        fetchTzBtcApy$(),
        fetchKUSDApy$(),
        fetchUSDTApy$(),
        fetchUUSDCApr$(tezos),
        fetchUBTCApr$(tezos),
        fetchYOUApr$(tezos, tokenUsdExchangeRates)
      ]).pipe(map(responses => loadTokensApyActions.success(Object.assign({}, ...responses))))
    )
  );

export const dAppsEpics = combineEpics(loadTokensApyEpic);
