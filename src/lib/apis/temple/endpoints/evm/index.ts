import { templeWalletApi } from '../templewallet.api';

import { BalancesResponse, ChainID, NftAddressBalanceNftResponse } from './api.interfaces';
import { GoldRushTransaction } from './types/transactions';

export type { GoldRushTransaction };

export const getEvmBalances = (walletAddress: string, chainId: ChainID) =>
  buildEvmRequest<BalancesResponse>('/balances', walletAddress, chainId);

/** Response also contains exchange rates */
export const getEvmTokensMetadata = (walletAddress: string, chainId: ChainID) =>
  buildEvmRequest<BalancesResponse>('/tokens-metadata', walletAddress, chainId);

export const getEvmCollectiblesMetadata = (walletAddress: string, chainId: ChainID) =>
  buildEvmRequest<NftAddressBalanceNftResponse>('/collectibles-metadata', walletAddress, chainId);

export const getEvmTransactions = (walletAddress: string, chainId: ChainID, page?: number) =>
  buildEvmRequest<{ items: GoldRushTransaction[]; current_page: number }>('/transactions', walletAddress, chainId, {
    page
  });

const buildEvmRequest = <T>(url: string, walletAddress: string, chainId: ChainID, params?: object) =>
  templeWalletApi
    .get<T>(`evm${url}`, {
      params: { ...params, walletAddress, chainId }
    })
    .then(
      res => res.data,
      error => {
        console.error(error);
        throw error;
      }
    );
