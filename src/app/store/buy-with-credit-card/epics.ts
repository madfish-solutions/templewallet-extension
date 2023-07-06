import { isDefined } from '@rnw-community/shared';
import { combineEpics } from 'redux-observable';
import { catchError, forkJoin, from, map, Observable, of, switchMap, withLatestFrom } from 'rxjs';
import { Action } from 'ts-action';
import { ofType } from 'ts-action-operators';

import { getMoonPayCurrencies } from 'lib/apis/moonpay';
import { getAliceBobPairInfo } from 'lib/apis/temple';
import { getBinanceConnectCurrencies } from 'lib/apis/temple-static';
import { getCurrenciesInfo as getUtorgCurrenciesInfo } from 'lib/apis/utorg';
import { PAIR_NOT_FOUND_MESSAGE } from 'lib/buy-with-credit-card/constants';
import { getUpdatedFiatLimits } from 'lib/buy-with-credit-card/get-updated-fiat-limits';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { createEntity } from 'lib/store';
import { getAxiosQueryErrorMessage } from 'lib/utils/get-axios-query-error-message';

import { loadAllCurrenciesActions, updatePairLimitsActions } from './actions';
import { BuyWithCreditCardRootState, TopUpProviderCurrencies } from './state';
import {
  mapAliceBobProviderCurrencies,
  mapMoonPayProviderCurrencies,
  mapUtorgProviderCurrencies,
  mapBinanceConnectProviderCurrencies
} from './utils';

const getCurrencies$ = <T>(fetchFn: () => Promise<T>, transformFn: (data: T) => TopUpProviderCurrencies) =>
  from(fetchFn()).pipe(
    map(data => createEntity(transformFn(data))),
    catchError(err => {
      console.error(err);
      return of(createEntity<TopUpProviderCurrencies>({ fiat: [], crypto: [] }, false, getAxiosQueryErrorMessage(err)));
    })
  );

const allTopUpProviderIds = [
  TopUpProviderId.MoonPay,
  TopUpProviderId.Utorg,
  TopUpProviderId.AliceBob,
  TopUpProviderId.BinanceConnect
];

const loadAllCurrenciesEpic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadAllCurrenciesActions.submit),
    switchMap(() =>
      forkJoin([
        getCurrencies$(getMoonPayCurrencies, mapMoonPayProviderCurrencies),
        getCurrencies$(getUtorgCurrenciesInfo, mapUtorgProviderCurrencies),
        getCurrencies$(() => getAliceBobPairInfo(false), mapAliceBobProviderCurrencies),
        getCurrencies$(getBinanceConnectCurrencies, mapBinanceConnectProviderCurrencies)
      ]).pipe(
        map(([moonpayCurrencies, utorgCurrencies, tezUahPairInfo, binanceConnectCurrencies]) =>
          loadAllCurrenciesActions.success({
            [TopUpProviderId.MoonPay]: moonpayCurrencies,
            [TopUpProviderId.Utorg]: utorgCurrencies,
            [TopUpProviderId.AliceBob]: tezUahPairInfo,
            [TopUpProviderId.BinanceConnect]: binanceConnectCurrencies
          })
        )
      )
    )
  );

const updatePairLimitsEpic = (action$: Observable<Action>, state$: Observable<BuyWithCreditCardRootState>) =>
  action$.pipe(
    ofType(updatePairLimitsActions.submit),
    withLatestFrom(state$),
    switchMap(([{ payload }, rootState]) => {
      const { fiatSymbol, cryptoSymbol } = payload;
      const { currencies } = rootState.buyWithCreditCard;
      const currentLimits = rootState.buyWithCreditCard.pairLimits[fiatSymbol]?.[cryptoSymbol];

      return forkJoin(
        allTopUpProviderIds.map(providerId => {
          const fiatCurrencies = currencies[providerId].data.fiat;
          const cryptoCurrencies = currencies[providerId].data.crypto;
          if (fiatCurrencies.length < 1 || cryptoCurrencies.length < 1) return of(createEntity(undefined));

          const prevEntity = currentLimits?.[providerId];
          if (prevEntity?.error === PAIR_NOT_FOUND_MESSAGE)
            return of(createEntity(undefined, false, PAIR_NOT_FOUND_MESSAGE));

          const fiatCurrency = fiatCurrencies.find(({ code }) => code === fiatSymbol);
          const cryptoCurrency = cryptoCurrencies.find(({ code }) => code === cryptoSymbol);

          if (isDefined(fiatCurrency) && isDefined(cryptoCurrency)) {
            return from(getUpdatedFiatLimits(fiatCurrency, cryptoCurrency, providerId));
          }

          return of(createEntity(undefined, false, PAIR_NOT_FOUND_MESSAGE));
        })
      ).pipe(
        map(([moonPayData, utorgData, aliceBobData, binanceConnectData]) =>
          updatePairLimitsActions.success({
            fiatSymbol,
            cryptoSymbol,
            limits: {
              [TopUpProviderId.MoonPay]: moonPayData,
              [TopUpProviderId.Utorg]: utorgData,
              [TopUpProviderId.AliceBob]: aliceBobData,
              [TopUpProviderId.BinanceConnect]: binanceConnectData
            }
          })
        )
      );
    })
  );

export const buyWithCreditCardEpics = combineEpics<Action, Action, BuyWithCreditCardRootState>(
  loadAllCurrenciesEpic,
  updatePairLimitsEpic
);
