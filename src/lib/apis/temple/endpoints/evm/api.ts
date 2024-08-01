import { templeWalletApi } from '../templewallet.api';

import { BalancesResponse, ChainID, NftAddressBalanceNftResponse } from './api.interfaces';

export const getEvmBalances = (walletAddress: string, chainId: ChainID) =>
  buildEvmRequest<BalancesResponse>('/balances', walletAddress, chainId);

// Response also contains exchange rates
export const getEvmTokensMetadata = (walletAddress: string, chainId: ChainID) =>
  buildEvmRequest<BalancesResponse>('/tokens-metadata', walletAddress, chainId);

export const getEvmCollectiblesMetadata = (walletAddress: string, chainId: ChainID) =>
  buildEvmRequest<NftAddressBalanceNftResponse>('/collectibles-metadata', walletAddress, chainId);

const buildEvmRequest = <T>(url: string, walletAddress: string, chainId: ChainID) =>
  templeWalletApi
    .get<T>(`evm${url}`, {
      params: { walletAddress, chainId }
    })
    .then(
      res => res.data,
      error => {
        console.error(error);
        throw error;
      }
    );
