import { createActions } from 'lib/store';

import { BuyWithCreditCardState, PairLimits } from './state';

export const loadAllCurrenciesActions = createActions<void, BuyWithCreditCardState['currencies'], string>(
  'buy-with-credit-card/LOAD_ALL_CURRENCIES'
);
export const updatePairLimitsActions = createActions<
  { fiatSymbol: string; cryptoSymbol: string },
  {
    fiatSymbol: string;
    cryptoSymbol: string;
    limits: PairLimits;
  },
  { fiatSymbol: string; cryptoSymbol: string; error: string }
>('buy-with-credit-card/UPDATE_PAIR_LIMITS');
