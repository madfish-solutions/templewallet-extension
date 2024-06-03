import { BalancesResponse, ChainID, NftAddressBalanceNftResponse } from 'lib/apis/temple/endpoints/evm/api.interfaces';

import { templeWalletApi } from '../templewallet.api';

export const getEvmBalances = (walletAddress: string, chainId: ChainID) =>
  buildEvmRequest<BalancesResponse>('/evm-balances', walletAddress, chainId);

// Response also contains exchange rates
export const getEvmTokensMetadata = (walletAddress: string, chainId: ChainID) =>
  buildEvmRequest<BalancesResponse>('/evm-tokens-metadata', walletAddress, chainId);

export const getEvmCollectiblesMetadata = (walletAddress: string, chainId: ChainID) =>
  buildEvmRequest<NftAddressBalanceNftResponse>('/evm-collectibles-metadata', walletAddress, chainId);

const buildEvmRequest = <T>(url: string, walletAddress: string, chainId: ChainID) =>
  templeWalletApi
    .get<T>(url, {
      params: { walletAddress, chainId }
    })
    .then(
      res => res.data,
      error => {
        console.error(error);
        throw error;
      }
    );
