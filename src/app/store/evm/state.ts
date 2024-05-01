interface EvmChainDataLoadingState {
  isLoading: boolean;
  error?: string;
}

type ChainId = number;

export interface EvmStateInterface {
  tokensLoadingStateRecord: Record<ChainId, EvmChainDataLoadingState>;
  collectiblesLoadingStateRecord: Record<ChainId, EvmChainDataLoadingState>;
}

export const EvmInitialState: EvmStateInterface = {
  tokensLoadingStateRecord: {},
  collectiblesLoadingStateRecord: {}
};
