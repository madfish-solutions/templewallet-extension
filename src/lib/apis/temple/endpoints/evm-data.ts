import { BalancesResponse, ChainID, NftAddressBalanceNftResponse } from 'lib/apis/temple/evm-data.interfaces';

import { templeWalletApi } from './templewallet.api';

export const getEvmBalances = (walletAddress: string, chainId: ChainID) =>
  templeWalletApi
    .get<BalancesResponse>('/evm-balances', {
      params: { walletAddress, chainId }
    })
    .then(res => res.data);

export const getEvmTokensMetadata = (walletAddress: string, chainId: ChainID) =>
  templeWalletApi
    .get<BalancesResponse>('/evm-tokens-metadata', {
      params: { walletAddress, chainId }
    })
    .then(res => res.data);

export const getEvmCollectiblesMetadata = (walletAddress: string, chainId: ChainID) =>
  templeWalletApi
    .get<NftAddressBalanceNftResponse>('/evm-collectibles-metadata', {
      params: { walletAddress, chainId }
    })
    .then(res => res.data);
