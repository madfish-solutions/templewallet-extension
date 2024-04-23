import { EVM_DEFAULT_NETWORKS } from '../../../../temple/networks';
import { BalancesResponse, ChainID, Quote } from '../evm-data.interfaces';

import { templeWalletApi } from './templewallet.api';

export const defaultChainIDs = EVM_DEFAULT_NETWORKS.map(network => network.chainId as ChainID);

export const getEVMData = (publicKeyHash: string, chainIDs?: ChainID[], quoteCurrency: Quote = 'USD') =>
  templeWalletApi
    .get<BalancesResponse[]>('/evm-data', { params: { walletAddress: publicKeyHash, chainIDs, quoteCurrency } })
    .then(res => res.data);
