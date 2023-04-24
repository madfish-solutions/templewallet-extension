import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { TopUpInputInterface, TopUpOutputInterface } from 'lib/buy-with-credit-card/topup.interface';
import { createEntity, LoadableEntityState } from 'lib/store';

export interface TopUpProviderCurrencies {
  fiat: TopUpInputInterface[];
  crypto: TopUpOutputInterface[];
}

export interface BuyWithCreditCardState {
  currencies: Record<TopUpProviderId, LoadableEntityState<TopUpProviderCurrencies>>;
}

export const buyWithCreditCardInitialState: BuyWithCreditCardState = {
  currencies: {
    [TopUpProviderId.MoonPay]: createEntity({ fiat: [], crypto: [] }),
    [TopUpProviderId.Utorg]: createEntity({ fiat: [], crypto: [] }),
    [TopUpProviderId.AliceBob]: createEntity({ fiat: [], crypto: [] })
  }
};

export interface BuyWithCreditCardRootState {
  buyWithCreditCard: BuyWithCreditCardState;
}
