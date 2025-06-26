import type { LoadableState } from 'lib/store/entity.utils';

export type EvmBalancesSource = 'onchain' | 'api';

export interface EvmLoadingStateInterface {
  balancesStates: Record<number, Record<EvmBalancesSource, LoadableState>>;
  tokensMetadataLoading: boolean;
  collectiblesMetadataLoading: boolean;
  chainsTokensExchangeRatesLoading: Record<number, boolean>;
}

export const EvmLoadingInitialState: EvmLoadingStateInterface = {
  balancesStates: {},
  tokensMetadataLoading: false,
  collectiblesMetadataLoading: false,
  chainsTokensExchangeRatesLoading: {}
};
