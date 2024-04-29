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

export const loadSingleEvmChainDataActions = createActions<
  LoadSingleEvmChainDataSubmitPayload,
  LoadSingleEvmChainDataSuccessPayload,
  LoadSingleEvmChainDataFailedPayload
>('evm/LOAD_SINGLE_CHAIN_EVM_DATA_ACTIONS');
