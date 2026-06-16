import { Route, RoutesResponse, Token, LiFiStep, StatusResponse, GetStatusRequest } from '@lifi/sdk';
import retry from 'async-retry';
import axios from 'axios';

import { templeWalletApi } from '../templewallet.api';

import { AssetTransfersWithMetadataResult, Log } from './alchemy';
import {
  BalancesResponse,
  ChainID,
  NftAddressBalanceNftResponse,
  Route3EvmRouteRequest,
  Route3EvmRoute,
  Route3EvmTokenWithPrice,
  RouteParams
} from './api.interfaces';

export const getEvmBalances = (walletAddress: string, chainId: ChainID) =>
  buildEvmRequest<BalancesResponse>('/balances', walletAddress, chainId);

/** Response also contains exchange rates */
export const getEvmTokensMetadata = (walletAddress: string, chainId: ChainID) =>
  buildEvmRequest<BalancesResponse>('/tokens-metadata', walletAddress, chainId);

export const getEvmCollectiblesMetadata = (walletAddress: string, chainId: ChainID) =>
  buildEvmRequest<NftAddressBalanceNftResponse>('/collectibles-metadata', walletAddress, chainId);

export const fetchSpamContracts = (chainId: number, signal?: AbortSignal) =>
  templeWalletApi
    .get<{ contracts: string[] }>('evm/spam-contracts', { params: { chainId }, signal })
    .then(r => r.data.contracts);

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

export const getEvmAllSwapRoutes = (params: RouteParams, signal?: AbortSignal) =>
  templeWalletApi.get<RoutesResponse>('evm/swap-routes', { params, signal }).then(
    res => res.data,
    error => {
      if (axios.isCancel(error) || error?.name === 'CanceledError') return;
      console.error(error);
      throw error;
    }
  );

export const getEvmSwapQuote = (params: RouteParams, signal?: AbortSignal) =>
  templeWalletApi.get<Route>('evm/swap-route', { params, signal }).then(
    res => res.data,
    error => {
      if (axios.isCancel(error) || error?.name === 'CanceledError') return;
      if (axios.isAxiosError(error) && error.response?.status === 404) return;
      console.error(error);
      throw error;
    }
  );

export const getLifiSupportedChains = () =>
  templeWalletApi.get<number[]>('evm/swap-chains').then(
    res => res.data,
    error => {
      console.error(error);
      throw error;
    }
  );

export const getLifiSwapTokens = (chainIds?: number[]) =>
  templeWalletApi
    .get<TokensByChain>('evm/swap-tokens', {
      params: chainIds ? { chainIds: chainIds.join(',') } : undefined
    })
    .then(
      res => res.data,
      error => {
        console.error(error);
        throw error;
      }
    );

export const getEvmSwapConnectionsMetadata = (fromChain: number, fromToken: string) =>
  retry(
    () =>
      templeWalletApi.get<TokensByChain>('evm/swap-connections', { params: { fromChain, fromToken } }).then(
        res => res.data,
        (error: any) => {
          if (axios.isCancel(error) || error?.name === 'CanceledError') return;
          console.error(error);
          throw error;
        }
      ),
    { retries: 3 }
  );

export const getEvmStepTransaction = (step: LiFiStep, signal?: AbortSignal): Promise<LiFiStep> =>
  templeWalletApi.post<LiFiStep>('evm/swap-step-transaction', step, { signal }).then(
    res => res.data,
    error => {
      console.error(error);
      throw error;
    }
  );

export const getEvmSwapStatus = (params: GetStatusRequest, signal?: AbortSignal): Promise<StatusResponse> =>
  templeWalletApi.get<StatusResponse>('evm/swap-status', { params, signal }).then(
    res => res.data,
    error => {
      console.error(error);
      throw error;
    }
  );

export const get3RouteEvmTokens = () =>
  templeWalletApi.get<StringRecord<Route3EvmTokenWithPrice>>('evm/3route-tokens').then(
    res => res.data,
    error => {
      console.error(error);
      throw error;
    }
  );

export const get3RouteEvmSwap = (params: Route3EvmRouteRequest) =>
  templeWalletApi.get<Route3EvmRoute>('evm/3route-swap', { params }).then(
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
