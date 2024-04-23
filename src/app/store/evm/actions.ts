import { ChainID, Quote } from 'lib/apis/temple/evm-data.interfaces';
import { createActions } from 'lib/store';

interface LoadEVMDataSubmitPayload {
  publicKeyHash: HexString;
  chainIds?: ChainID[];
  quoteCurrency?: Quote;
}

export const loadEVMDataActions = createActions<LoadEVMDataSubmitPayload, void, string>('evm/LOAD_EVM_DATA_ACTIONS');
