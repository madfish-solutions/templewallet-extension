import { combineEpics, Epic } from 'redux-observable';
import { from, forkJoin, map, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { ofType } from 'ts-action-operators';

import { fetchUsdToTokenRates } from 'lib/apis/temple';
import { fetchFiatToTezosRates } from 'lib/fiat-currency';

import { loadExchangeRates } from './actions';

const loadUsdToTokenRates$ = () => from(fetchUsdToTokenRates());
const loadFiatToTezosRates$ = () => from(fetchFiatToTezosRates());

const loadExchangeRatesEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadExchangeRates.submit),
    switchMap(() =>
      forkJoin([loadUsdToTokenRates$(), loadFiatToTezosRates$()]).pipe(
        map(([usdToTokenRates, fiatToTezosRates]) => loadExchangeRates.success({ usdToTokenRates, fiatToTezosRates })),
        catchError(error => of(loadExchangeRates.fail(error.message)))
      )
    )
  );

export const currencyEpics = combineEpics(loadExchangeRatesEpic);
