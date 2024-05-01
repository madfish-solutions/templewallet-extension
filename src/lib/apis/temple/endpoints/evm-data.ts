import { BalancesResponse, ChainID, NftAddressBalanceNftResponse } from 'lib/apis/temple/evm-data.interfaces';

import { templeWalletApi } from './templewallet.api';

export const getEvmSingleChainTokens = (walletAddress: string, chainId: ChainID) =>
  templeWalletApi
    .get<BalancesResponse>('/evm-single-chain-tokens', {
      params: { walletAddress, chainId }
    })
    .then(res => res.data);

export const getEvmSingleChainNfts = (walletAddress: string, chainId: ChainID) =>
  templeWalletApi
    .get<NftAddressBalanceNftResponse>('/evm-single-chain-nfts', {
      params: { walletAddress, chainId }
    })
    .then(res => res.data);
