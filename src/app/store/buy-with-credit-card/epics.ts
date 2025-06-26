import { isDefined } from '@rnw-community/shared';
import { Action } from 'redux';
import { combineEpics, Epic } from 'redux-observable';
import { catchError, forkJoin, from, map, of, switchMap, withLatestFrom } from 'rxjs';
import { ofType } from 'ts-action-operators';

import type { RootState } from 'app/store/root-state.type';
import { getMoonPayCurrencies } from 'lib/apis/moonpay';
import { getCurrenciesInfo as getUtorgCurrenciesInfo } from 'lib/apis/utorg';
import { PAIR_NOT_FOUND_MESSAGE } from 'lib/buy-with-credit-card/constants';
import { getUpdatedFiatLimits } from 'lib/buy-with-credit-card/get-updated-fiat-limits';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { createEntity } from 'lib/store';
import { getAxiosQueryErrorMessage } from 'lib/utils/get-axios-query-error-message';

import { loadAllCurrenciesActions, updatePairLimitsActions } from './actions';
import { TopUpProviderCurrencies } from './state';
import { mapMoonPayProviderCurrencies, mapUtorgProviderCurrencies } from './utils';

const getCurrencies$ = <T>(fetchFn: () => Promise<T>, transformFn: (data: T) => TopUpProviderCurrencies) =>
  from(fetchFn()).pipe(
    map(data => createEntity(transformFn(data))),
    catchError(err => {
      console.error(err);
      return of(createEntity<TopUpProviderCurrencies>({ fiat: [], crypto: [] }, false, getAxiosQueryErrorMessage(err)));
    })
  );

const allTopUpProviderIds = [TopUpProviderId.MoonPay, TopUpProviderId.Utorg];

const loadAllCurrenciesEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadAllCurrenciesActions.submit),
    switchMap(() =>
      forkJoin([
        getCurrencies$(getMoonPayCurrencies, mapMoonPayProviderCurrencies),
        getCurrencies$(getUtorgCurrenciesInfo, mapUtorgProviderCurrencies)
      ]).pipe(
        map(([moonpayCurrencies, utorgCurrencies]) =>
          loadAllCurrenciesActions.success({
            [TopUpProviderId.MoonPay]: moonpayCurrencies,
            [TopUpProviderId.Utorg]: utorgCurrencies
          })
        )
      )
    )
  );

const updatePairLimitsEpic: Epic<Action, Action, RootState> = (action$, state$) =>
  action$.pipe(
    ofType(updatePairLimitsActions.submit),
    withLatestFrom(state$),
    switchMap(([{ payload }, rootState]) => {
      const { fiatSymbol, cryptoSlug } = payload;
      const { currencies } = rootState.buyWithCreditCard;
      const currentLimits = rootState.buyWithCreditCard.pairLimits[fiatSymbol]?.[cryptoSlug];

      return forkJoin(
        allTopUpProviderIds.map(providerId => {
          const fiatCurrencies = currencies[providerId].data.fiat;
          const cryptoCurrencies = currencies[providerId].data.crypto;
          if (fiatCurrencies.length < 1 || cryptoCurrencies.length < 1) return of(createEntity(undefined));

          const prevEntity = currentLimits?.[providerId];
          if (prevEntity?.error === PAIR_NOT_FOUND_MESSAGE)
            return of(createEntity(undefined, false, PAIR_NOT_FOUND_MESSAGE));

          const fiatCurrency = fiatCurrencies.find(({ code }) => code === fiatSymbol);
          const cryptoCurrency = cryptoCurrencies.find(({ slug }) => slug === cryptoSlug);

          if (isDefined(fiatCurrency) && isDefined(cryptoCurrency)) {
            return from(getUpdatedFiatLimits(fiatCurrency, cryptoCurrency, providerId));
          }

          return of(createEntity(undefined, false, PAIR_NOT_FOUND_MESSAGE));
        })
      ).pipe(
        map(([moonPayData, utorgData]) =>
          updatePairLimitsActions.success({
            fiatSymbol,
            cryptoSlug,
            limits: {
              [TopUpProviderId.MoonPay]: moonPayData,
              [TopUpProviderId.Utorg]: utorgData
            }
          })
        )
      );
    })
  );

export const buyWithCreditCardEpics = combineEpics(loadAllCurrenciesEpic, updatePairLimitsEpic);
