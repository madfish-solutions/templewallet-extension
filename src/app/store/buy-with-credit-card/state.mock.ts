import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { createEntity } from 'lib/store';

import { BuyWithCreditCardState } from './state';

export const mockBuyWithCreditCardState: BuyWithCreditCardState = {
  currencies: {
    [TopUpProviderId.MoonPay]: createEntity({ fiat: [], crypto: [] }),
    [TopUpProviderId.Utorg]: createEntity({ fiat: [], crypto: [] })
  },
  pairLimits: {}
};
