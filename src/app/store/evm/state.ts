interface EvmChainDataLoadingState {
  isLoading: boolean;
  error?: string;
}

type ChainId = number;

export interface EvmStateInterface {
  balancesLoading: boolean;
  tokensMetadataLoadingStateRecord: Record<ChainId, EvmChainDataLoadingState>;
  collectiblesMetadataLoadingStateRecord: Record<ChainId, EvmChainDataLoadingState>;
}

export const EvmInitialState: EvmStateInterface = {
  balancesLoading: false,
  tokensMetadataLoadingStateRecord: {},
  collectiblesMetadataLoadingStateRecord: {}
};
