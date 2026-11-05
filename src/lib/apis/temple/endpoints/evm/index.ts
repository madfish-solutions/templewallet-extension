import { Route, RoutesResponse, Token, LiFiStep, StatusResponse, GetStatusRequest } from '@lifi/sdk';
import retry from 'async-retry';
import axios from 'axios';

import { isAbortError } from 'lib/apis/utils';
import { stripUndefinedProps } from 'lib/utils';

import { templeWalletApi } from '../templewallet.api';

import { AssetTransfersWithMetadataResult, Log } from './alchemy';
import {
  BalancesResponse,
  ChainID,
  NftAddressBalanceNftResponse,
  Route3EvmRouteRequest,
  Route3EvmRoute,
  Route3EvmTokenWithPrice,
  RouteParams,
  OpenseaNftDetailed,
  OpenseaNftRef
} from './api.interfaces';

export type {
  ChainID,
  BalancesResponse,
  RouteParams,
  BalanceItem,
  BalanceNftData,
  NftCollectionAttribute,
  NftAddressBalanceNftResponse,
  NftTokenContractBalanceItem,
  NftData,
  Route3EvmRoute,
  Route3EvmTokenWithPrice,
  OpenseaNftDetailed,
  OpenseaNftRef
} from './api.interfaces';

export const getEvmBalances = (walletAddress: string, chainId: ChainID) =>
  buildEvmRequest<BalancesResponse>({ path: '/balances', walletAddress, chainId });

/** Response also contains exchange rates */
export const getEvmTokensMetadata = (walletAddress: string, chainId: ChainID) =>
  buildEvmRequest<BalancesResponse>({ path: '/tokens-metadata', walletAddress, chainId });

export const getEvmCollectiblesMetadata = (walletAddress: string, chainId: ChainID, signal?: AbortSignal) =>
  buildEvmRequest<NftAddressBalanceNftResponse>({ path: '/collectibles-metadata', walletAddress, chainId, signal });

/** The multichain OpenSea metadata route rejects requests with more than 30 items. */
export const OPENSEA_MULTICHAIN_NFTS_LIMIT = 30;

export const getOpenseaMultichainNftsMetadata = (nftRefs: OpenseaNftRef[], signal?: AbortSignal) =>
  buildEvmRequest<Array<OpenseaNftDetailed | null>>({
    path: '/multichain-collectibles-metadata',
    method: 'post',
    body: nftRefs.slice(0, OPENSEA_MULTICHAIN_NFTS_LIMIT),
    signal
  });

export const getOpenseaChainNftsMetadata = (
  chainId: number,
  walletAddress: string,
  collection?: string,
  next?: string,
  signal?: AbortSignal
) =>
  buildEvmRequest<{ nfts: Array<OpenseaNftDetailed>; next?: string | null }>({
    path: '/opensea-collectibles-metadata',
    chainId,
    walletAddress,
    params: stripUndefinedProps({ collection, next }),
    signal
  });

export const fetchEvmTransactions = (
  walletAddress: string,
  chainId: number,
  contractAddress: string | undefined,
  olderThanBlockHeight?: `${number}`,
  signal?: AbortSignal
) =>
  buildEvmRequest<TransactionsResponse>({
    path: '/transactions/v2',
    walletAddress,
    chainId,
    params: { contractAddress, olderThanBlockHeight },
    signal
  });

export interface TokensByChain {
  [chainId: number]: Token[];
}

export const fetchEvmAccountInitialized = (walletAddress: string, signal?: AbortSignal) =>
  buildEvmRequest<{ isInitialized: boolean }>({ path: '/is-initialized', walletAddress, signal });

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
  templeWalletApi.get<number[]>('evm/swap-chains', { timeout: 10_000 }).then(
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

interface BuildEvmRequestParamsBase {
  path: string;
  walletAddress?: string;
  chainId?: number;
  params?: object;
  signal?: AbortSignal;
  method?: 'get' | 'post';
  body?: any;
}

interface BuildEvmRequestParamsGet extends BuildEvmRequestParamsBase {
  method?: 'get';
  body?: undefined;
}

interface BuildEvmRequestParamsPost extends BuildEvmRequestParamsBase {
  method: 'post';
}

type BuildEvmRequestParams = BuildEvmRequestParamsGet | BuildEvmRequestParamsPost;

const buildEvmRequest = <T>({
  path,
  walletAddress,
  chainId,
  params,
  signal,
  method = 'get',
  body
}: BuildEvmRequestParams) => {
  const config = {
    params: { ...params, walletAddress, chainId },
    signal,
    ...(body instanceof Uint8Array ? { headers: { 'Content-Type': 'application/octet-stream' } } : {})
  };
  const request =
    method === 'post'
      ? templeWalletApi.post<T>(`evm${path}`, body, config)
      : templeWalletApi.get<T>(`evm${path}`, config);

  return request.then(
    res => res.data,
    error => {
      if (!isAbortError(error)) console.error(error);
      throw error;
    }
  );
};
