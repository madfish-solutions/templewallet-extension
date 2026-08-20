import { createReducer } from '@reduxjs/toolkit';
import { isDefined } from '@rnw-community/shared';

import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { createEntity } from 'lib/store';

import { loadAllCurrenciesActions, updatePairLimitsActions } from './actions';
import { buyWithCreditCardInitialState, BuyWithCreditCardState } from './state';

export const buyWithCreditCardReducer = createReducer<BuyWithCreditCardState>(
  buyWithCreditCardInitialState,
  builder => {
    builder.addCase(loadAllCurrenciesActions.submit, state => {
      state.currencies[TopUpProviderId.MoonPay].isLoading = true;
      state.currencies[TopUpProviderId.MtPelerin].isLoading = true;
    });

    builder.addCase(loadAllCurrenciesActions.success, (state, { payload: currencies }) => ({
      ...state,
      currencies
    }));

    builder.addCase(loadAllCurrenciesActions.fail, (state, { payload: error }) => ({
      ...state,
      currencies: {
        [TopUpProviderId.MoonPay]: createEntity(state.currencies[TopUpProviderId.MoonPay].data, false, error),
        [TopUpProviderId.MtPelerin]: createEntity(state.currencies[TopUpProviderId.MtPelerin].data, false, error)
      }
    }));

    builder.addCase(updatePairLimitsActions.submit, (state, { payload: { fiatSymbol, cryptoSlug } }) => {
      if (!state.pairLimits[fiatSymbol]) state.pairLimits[fiatSymbol] = {};

      const dataPerFiat = state.pairLimits[fiatSymbol];

      if (isDefined(dataPerFiat[cryptoSlug])) {
        const dataPerFiatPerCrypto = dataPerFiat[cryptoSlug];
        const updatePerProvider = (providerId: TopUpProviderId) => {
          dataPerFiatPerCrypto[providerId].isLoading = true;
        };

        updatePerProvider(TopUpProviderId.MoonPay);
        updatePerProvider(TopUpProviderId.MtPelerin);
      } else {
        dataPerFiat[cryptoSlug] = {
          [TopUpProviderId.MoonPay]: createEntity(undefined, true),
          [TopUpProviderId.MtPelerin]: createEntity(undefined, true)
        };
      }
    });

    builder.addCase(updatePairLimitsActions.success, (state, { payload: { fiatSymbol, cryptoSlug, limits } }) => ({
      ...state,
      pairLimits: {
        ...state.pairLimits,
        [fiatSymbol]: {
          ...(state.pairLimits[fiatSymbol] ?? {}),
          [cryptoSlug]: limits // They come with `isLoading === false`
        }
      }
    }));

    builder.addCase(updatePairLimitsActions.fail, (state, { payload: { fiatSymbol, cryptoSlug, error } }) => {
      const previousEntities = state.pairLimits[fiatSymbol]?.[cryptoSlug];

      return {
        ...state,
        pairLimits: {
          ...state.pairLimits,
          [fiatSymbol]: {
            ...(state.pairLimits[fiatSymbol] ?? {}),
            [cryptoSlug]: {
              [TopUpProviderId.MoonPay]: createEntity(previousEntities?.[TopUpProviderId.MoonPay]?.data, false, error),
              [TopUpProviderId.MtPelerin]: createEntity(
                previousEntities?.[TopUpProviderId.MtPelerin]?.data,
                false,
                error
              )
            }
          }
        }
      };
    });
  }
);
