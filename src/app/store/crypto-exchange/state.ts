import { createEntity, LoadableEntityState } from 'lib/store';

export interface StoredExolixCurrency {
  icon: string;
  name: string;
  code: string;
  network: {
    code: string;
    fullName: string;
    shortName: string | nullish;
  };
}

export interface CryptoExchangeState {
  exolixCurrencies: LoadableEntityState<Array<StoredExolixCurrency>>;
}

export const cryptoExchangeInitialState: CryptoExchangeState = {
  exolixCurrencies: createEntity([])
};
