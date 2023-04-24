import { combineEpics } from 'redux-observable';
import { catchError, forkJoin, from, map, Observable, of, switchMap } from 'rxjs';
import { Action } from 'ts-action';
import { ofType } from 'ts-action-operators';

import { fetchMoonpayCryptoCurrencies$, fetchMoonpayFiatCurrencies$ } from 'lib/apis/moonpay';
import { getAliceBobPairInfo } from 'lib/apis/temple';
import { getCurrenciesInfo as getUtorgCurrenciesInfo } from 'lib/apis/utorg';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { createEntity } from 'lib/store';

import { loadAllCurrenciesActions } from './actions';
import { TopUpProviderCurrencies } from './state';
import { mapAliceBobProviderCurrencies, mapMoonPayProviderCurrencies, mapUtorgProviderCurrencies } from './utils';

const getCurrencies$ = <T>(fetchFn: () => Observable<T>, transformFn: (data: T) => TopUpProviderCurrencies) =>
  fetchFn().pipe(
    map(data => createEntity(transformFn(data))),
    catchError(err => of(createEntity<TopUpProviderCurrencies>({ fiat: [], crypto: [] }, err.message)))
  );

const loadAllCurrenciesEpic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadAllCurrenciesActions.submit),
    switchMap(() =>
      forkJoin([
        getCurrencies$(
          () => forkJoin([fetchMoonpayFiatCurrencies$(), fetchMoonpayCryptoCurrencies$()]),
          mapMoonPayProviderCurrencies
        ),
        getCurrencies$(() => from(getUtorgCurrenciesInfo()), mapUtorgProviderCurrencies),
        getCurrencies$(() => from(getAliceBobPairInfo(false)), mapAliceBobProviderCurrencies)
      ]).pipe(
        map(([moonpayCurrencies, utorgCurrencies, tezUahPairInfo]) =>
          loadAllCurrenciesActions.success({
            [TopUpProviderId.MoonPay]: moonpayCurrencies,
            [TopUpProviderId.Utorg]: utorgCurrencies,
            [TopUpProviderId.AliceBob]: tezUahPairInfo
          })
        )
      )
    )
  );

export const buyWithCreditCardEpics = combineEpics(loadAllCurrenciesEpic);
