import { ChainID } from 'lib/apis/temple/evm-data.interfaces';
import { createActions } from 'lib/store';

interface LoadSingleEvmChainDataSuccessPayload {
  chainId: ChainID;
}

interface LoadSingleEvmChainDataSubmitPayload extends LoadSingleEvmChainDataSuccessPayload {
  publicKeyHash: HexString;
}

interface LoadSingleEvmChainDataFailedPayload extends LoadSingleEvmChainDataSuccessPayload {
  error?: string;
}

export const loadSingleEvmChainTokensActions = createActions<
  LoadSingleEvmChainDataSubmitPayload,
  LoadSingleEvmChainDataSuccessPayload,
  LoadSingleEvmChainDataFailedPayload
>('evm/LOAD_SINGLE_CHAIN_TOKENS_ACTIONS');

export const loadSingleEvmChainCollectiblesActions = createActions<
  LoadSingleEvmChainDataSubmitPayload,
  LoadSingleEvmChainDataSuccessPayload,
  LoadSingleEvmChainDataFailedPayload
>('evm/LOAD_SINGLE_CHAIN_COLLECTIBLES_ACTIONS');
