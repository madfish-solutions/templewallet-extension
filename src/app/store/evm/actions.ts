import { ChainID, Quote } from 'lib/apis/temple/evm-data.interfaces';
import { createActions } from 'lib/store';

interface LoadEVMDataSubmitPayload {
  publicKeyHash: string;
  chainIds?: ChainID[];
  quoteCurrency?: Quote;
}

export const loadEVMDataActions = createActions<LoadEVMDataSubmitPayload, void, string>('evm/LOAD_EVM_DATA_ACTIONS');
