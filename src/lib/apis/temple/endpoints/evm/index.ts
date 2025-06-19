import { Route, Token } from '@lifi/sdk';
import axios from 'axios';

import { templeWalletApi } from '../templewallet.api';

import { AssetTransfersWithMetadataResult, Log } from './alchemy';
import { BalancesResponse, ChainID, NftAddressBalanceNftResponse, RouteParams } from './api.interfaces';

export const getEvmBalances = (walletAddress: string, chainId: ChainID) =>
  buildEvmRequest<BalancesResponse>('/balances', walletAddress, chainId);

/** Response also contains exchange rates */
export const getEvmTokensMetadata = (walletAddress: string, chainId: ChainID) =>
  buildEvmRequest<BalancesResponse>('/tokens-metadata', walletAddress, chainId);

export const getEvmCollectiblesMetadata = (walletAddress: string, chainId: ChainID) =>
  buildEvmRequest<NftAddressBalanceNftResponse>('/collectibles-metadata', walletAddress, chainId);

export const fetchEvmTransactions = (
  walletAddress: string,
  chainId: number,
  contractAddress: string | undefined,
  olderThanBlockHeight?: `${number}`,
  signal?: AbortSignal
) =>
  buildEvmRequest<TransactionsResponse>(
    '/transactions/v2',
    walletAddress,
    chainId,
    {
      contractAddress,
      olderThanBlockHeight
    },
    signal
  );

export interface TokensByChain {
  [chainId: number]: Token[];
}

export const fetchEvmAccountInitialized = (walletAddress: string, signal?: AbortSignal) =>
  buildEvmRequest<{ isInitialized: boolean }>('/is-initialized', walletAddress, undefined, undefined, signal);

interface TransactionsResponse {
  transfers: AssetTransfersWithMetadataResult[];
  /** These depend on the blocks gap of returned transfers. */
  approvals: Log[];
}

export const getEvmBestSwapRoute = (params: RouteParams, signal?: AbortSignal) =>
  templeWalletApi.get<Route>('evm/swap-route', { params, signal }).then(
    res => res.data,
    error => {
      if (axios.isCancel(error) || error?.name === 'CanceledError') return;
      console.error(error);
      throw error;
    }
  );

export const getEvmSwapTokensMetadata = (chainIds: ChainID[]) =>
  templeWalletApi.get<TokensByChain>('evm/swap-tokens', { params: { chainIds: chainIds.join(',') } }).then(
    res => res.data,
    error => {
      console.error(error);
      throw error;
    }
  );

const buildEvmRequest = <T>(
  path: string,
  walletAddress: string,
  chainId?: number,
  params?: object,
  signal?: AbortSignal
) =>
  templeWalletApi
    .get<T>(`evm${path}`, {
      params: { ...params, walletAddress, chainId },
      signal
    })
    .then(
      res => res.data,
      error => {
        console.error(error);
        throw error;
      }
    );
