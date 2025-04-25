import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import {
  TopUpInputInterface,
  TopUpOutputInterface,
  TopUpProviderPairLimits
} from 'lib/buy-with-credit-card/topup.interface';
import { createEntity, LoadableEntityState } from 'lib/store';

export interface TopUpProviderCurrencies {
  fiat: TopUpInputInterface[];
  crypto: TopUpOutputInterface[];
}

export type PairLimits = Record<TopUpProviderId, LoadableEntityState<TopUpProviderPairLimits | undefined>>;

export interface BuyWithCreditCardState {
  currencies: Record<TopUpProviderId, LoadableEntityState<TopUpProviderCurrencies>>;
  pairLimits: Record<string, Record<string, PairLimits>>;
}

export const buyWithCreditCardInitialState: BuyWithCreditCardState = {
  currencies: {
    [TopUpProviderId.MoonPay]: createEntity({ fiat: [], crypto: [] }),
    [TopUpProviderId.Utorg]: createEntity({ fiat: [], crypto: [] })
  },
  pairLimits: {}
};
