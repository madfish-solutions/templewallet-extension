import { BalancesResponse, ChainID, NftAddressBalanceNftResponse } from 'lib/apis/temple/endpoints/evm/api.interfaces';

import { templeWalletApi } from '../templewallet.api';

export const getEvmBalances = (walletAddress: string, chainId: ChainID) =>
  templeWalletApi
    .get<BalancesResponse>('/evm-balances', {
      params: { walletAddress, chainId }
    })
    .then(
      res => res.data,
      error => {
        console.error(error);
        throw error;
      }
    );

// Response also contains exchange rates
export const getEvmTokensMetadata = (walletAddress: string, chainId: ChainID) =>
  templeWalletApi
    .get<BalancesResponse>('/evm-tokens-metadata', {
      params: { walletAddress, chainId }
    })
    .then(
      res => res.data,
      error => {
        console.error(error);
        throw error;
      }
    );

export const getEvmCollectiblesMetadata = (walletAddress: string, chainId: ChainID) =>
  templeWalletApi
    .get<NftAddressBalanceNftResponse>('/evm-collectibles-metadata', {
      params: { walletAddress, chainId }
    })
    .then(
      res => res.data,
      error => {
        console.error(error);
        throw error;
      }
    );
