import { createEntity } from '../create-entity';
import { LoadableEntityState } from '../types';

export type ExchangeRateRecord<V = string> = Record<string, V>;

export interface CurrencyState {
  usdToTokenRates: LoadableEntityState<ExchangeRateRecord>;
  fiatToTezosRates: LoadableEntityState<ExchangeRateRecord<number>>;
}

export const currencyInitialState: CurrencyState = {
  usdToTokenRates: createEntity({}),
  fiatToTezosRates: createEntity({})
};
