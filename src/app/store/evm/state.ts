export interface EvmLoadingStateInterface {
  balancesLoading: boolean;
  tokensMetadataLoading: boolean;
  collectiblesMetadataLoading: boolean;
  tokensExchangeRatesLoading: boolean;
}

export const EvmLoadingInitialState: EvmLoadingStateInterface = {
  balancesLoading: false,
  tokensMetadataLoading: false,
  collectiblesMetadataLoading: false,
  tokensExchangeRatesLoading: false
};
