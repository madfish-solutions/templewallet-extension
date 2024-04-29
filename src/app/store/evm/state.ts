interface EvmChainDataLoadingState {
  isLoading: boolean;
  error?: string;
}

type ChainId = number;

export interface EvmStateInterface {
  loadingStateRecord: Record<ChainId, EvmChainDataLoadingState>;
}

export const EvmInitialState: EvmStateInterface = {
  loadingStateRecord: {}
};
