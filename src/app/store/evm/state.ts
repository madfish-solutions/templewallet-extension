interface EvmChainDataLoadingState {
  isLoading: boolean;
  error?: string;
}

type ChainId = number;

export interface EvmStateInterface {
  balancesLoadingStateRecord: Record<ChainId, EvmChainDataLoadingState>;
  tokensMetadataLoadingStateRecord: Record<ChainId, EvmChainDataLoadingState>;
  collectiblesMetadataLoadingStateRecord: Record<ChainId, EvmChainDataLoadingState>;
}

export const EvmInitialState: EvmStateInterface = {
  balancesLoadingStateRecord: {},
  tokensMetadataLoadingStateRecord: {},
  collectiblesMetadataLoadingStateRecord: {}
};
