import { combineEpics, Epic } from 'redux-observable';
import { from, forkJoin, map, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { ofType } from 'ts-action-operators';

import { fetchBtcToUsdRateRate, fetchUsdToTokenRates } from 'lib/apis/temple';
import { fetchFiatToTezosRates } from 'lib/fiat-currency';

import { loadExchangeRates } from './actions';

const loadUsdToTokenRates$ = () => from(fetchUsdToTokenRates());
const loadFiatToTezosRates$ = () => from(fetchFiatToTezosRates());
const loadBtcToUsdRate$ = () => from(fetchBtcToUsdRateRate());

const loadExchangeRatesEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadExchangeRates.submit),
    switchMap(() =>
      forkJoin([loadUsdToTokenRates$(), loadFiatToTezosRates$(), loadBtcToUsdRate$()]).pipe(
        map(([usdToTokenRates, fiatToTezosRates, btcToUsdRate]) =>
          loadExchangeRates.success({ usdToTokenRates, fiatToTezosRates, btcToUsdRate })
        ),
        catchError(error => of(loadExchangeRates.fail(error.message)))
      )
    )
  );

export const currencyEpics = combineEpics(loadExchangeRatesEpic);
