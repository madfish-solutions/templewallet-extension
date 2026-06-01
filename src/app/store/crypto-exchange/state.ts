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

export type ExolixNetworksMap = Record<number, string>;

export interface CryptoExchangeState {
  exolixCurrencies: LoadableEntityState<Array<StoredExolixCurrency>>;
  exolixNetworksMap: LoadableEntityState<ExolixNetworksMap>;
  exolixNetworksMapLoadedAt: number;
}

export const cryptoExchangeInitialState: CryptoExchangeState = {
  exolixCurrencies: createEntity([]),
  exolixNetworksMap: createEntity({}),
  exolixNetworksMapLoadedAt: 0
};
