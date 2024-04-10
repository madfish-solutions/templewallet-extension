import { BalancesResponse, ChainID, Quote } from '../evm-data.interfaces';

import { templeWalletApi } from './templewallet.api';

// TODO: get default EVM chain ids from settings
export const defaultChainIDs = [1, 11155111, 137, 80001, 56, 97, 43114, 43113, 10, 11155420] as ChainID[];

export const getEVMData = (publicKeyHash: string, chainIDs?: ChainID[], quoteCurrency: Quote = 'USD') =>
  templeWalletApi
    .get<BalancesResponse[]>('/evm-data', { params: { walletAddress: publicKeyHash, chainIDs, quoteCurrency } })
    .then(res => res.data);
