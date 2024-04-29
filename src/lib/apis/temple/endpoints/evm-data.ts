import { BalancesResponse, ChainID, Quote } from 'lib/apis/temple/evm-data.interfaces';

import { templeWalletApi } from './templewallet.api';

export const getEvmSingleChainData = (walletAddress: string, chainId: ChainID, quoteCurrency: Quote = 'USD') =>
  templeWalletApi
    .get<BalancesResponse>('/evm-single-chain-data', {
      params: { walletAddress, chainId, quoteCurrency }
    })
    .then(res => res.data);
