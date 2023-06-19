import { createReducer } from '@reduxjs/toolkit';

import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { createEntity } from 'lib/store';

import { loadAllCurrenciesActions, updatePairLimitsActions } from './actions';
import { buyWithCreditCardInitialState, BuyWithCreditCardState } from './state';

export const buyWithCreditCardReducer = createReducer<BuyWithCreditCardState>(
  buyWithCreditCardInitialState,
  builder => {
    builder.addCase(loadAllCurrenciesActions.submit, state => ({
      ...state,
      currencies: {
        [TopUpProviderId.MoonPay]: createEntity(state.currencies[TopUpProviderId.MoonPay].data, true),
        [TopUpProviderId.Utorg]: createEntity(state.currencies[TopUpProviderId.Utorg].data, true),
        [TopUpProviderId.AliceBob]: createEntity(state.currencies[TopUpProviderId.AliceBob].data, true)
      }
    }));

    builder.addCase(loadAllCurrenciesActions.success, (state, { payload: currencies }) => ({
      ...state,
      currencies
    }));

    builder.addCase(loadAllCurrenciesActions.fail, (state, { payload: error }) => ({
      ...state,
      currencies: {
        [TopUpProviderId.MoonPay]: createEntity(state.currencies[TopUpProviderId.MoonPay].data, false, error),
        [TopUpProviderId.Utorg]: createEntity(state.currencies[TopUpProviderId.Utorg].data, false, error),
        [TopUpProviderId.AliceBob]: createEntity(state.currencies[TopUpProviderId.AliceBob].data, false, error)
      }
    }));

    builder.addCase(updatePairLimitsActions.submit, (state, { payload: { fiatSymbol, cryptoSymbol } }) => {
      const previousEntities = state.pairLimits[fiatSymbol]?.[cryptoSymbol];

      return {
        ...state,
        pairLimits: {
          ...state.pairLimits,
          [fiatSymbol]: {
            ...(state.pairLimits[fiatSymbol] ?? {}),
            [cryptoSymbol]: {
              [TopUpProviderId.MoonPay]: createEntity(previousEntities?.[TopUpProviderId.MoonPay]?.data, true),
              [TopUpProviderId.Utorg]: createEntity(previousEntities?.[TopUpProviderId.Utorg]?.data, true),
              [TopUpProviderId.AliceBob]: createEntity(previousEntities?.[TopUpProviderId.AliceBob]?.data, true)
            }
          }
        }
      };
    });

    builder.addCase(updatePairLimitsActions.success, (state, { payload: { fiatSymbol, cryptoSymbol, limits } }) => ({
      ...state,
      pairLimits: {
        ...state.pairLimits,
        [fiatSymbol]: {
          ...(state.pairLimits[fiatSymbol] ?? {}),
          [cryptoSymbol]: {
            [TopUpProviderId.MoonPay]: createEntity(
              limits[TopUpProviderId.MoonPay].data,
              false,
              limits[TopUpProviderId.MoonPay].error
            ),
            [TopUpProviderId.Utorg]: createEntity(
              limits[TopUpProviderId.Utorg].data,
              false,
              limits[TopUpProviderId.Utorg].error
            ),
            [TopUpProviderId.AliceBob]: createEntity(
              limits[TopUpProviderId.AliceBob].data,
              false,
              limits[TopUpProviderId.AliceBob].error
            )
          }
        }
      }
    }));

    builder.addCase(updatePairLimitsActions.fail, (state, { payload: { fiatSymbol, cryptoSymbol, error } }) => {
      const previousEntities = state.pairLimits[fiatSymbol]?.[cryptoSymbol];

      return {
        ...state,
        pairLimits: {
          ...state.pairLimits,
          [fiatSymbol]: {
            ...(state.pairLimits[fiatSymbol] ?? {}),
            [cryptoSymbol]: {
              [TopUpProviderId.MoonPay]: createEntity(previousEntities?.[TopUpProviderId.MoonPay]?.data, false, error),
              [TopUpProviderId.Utorg]: createEntity(previousEntities?.[TopUpProviderId.Utorg]?.data, false, error),
              [TopUpProviderId.AliceBob]: createEntity(previousEntities?.[TopUpProviderId.AliceBob]?.data, false, error)
            }
          }
        }
      };
    });
  }
);
