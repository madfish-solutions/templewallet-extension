import { createReducer } from '@reduxjs/toolkit';

import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { createEntity } from 'lib/store';

import { loadAllCurrenciesActions } from './actions';
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
  }
);
