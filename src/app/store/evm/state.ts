import type { LoadableState } from 'lib/store/entity.utils';

export interface EvmLoadingStateInterface {
  balances: Record<number, LoadableState>;
  tokensMetadataLoading: boolean;
  collectiblesMetadataLoading: boolean;
  chainsTokensExchangeRatesLoading: Record<number, boolean>;
}

export const EvmLoadingInitialState: EvmLoadingStateInterface = {
  balances: {},
  tokensMetadataLoading: false,
  collectiblesMetadataLoading: false,
  chainsTokensExchangeRatesLoading: {}
};
