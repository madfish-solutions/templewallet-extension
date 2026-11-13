import { Route, RoutesResponse, Token, LiFiStep, StatusResponse, GetStatusRequest } from '@lifi/sdk';
import retry from 'async-retry';
import axios from 'axios';

import { isAbortError } from 'lib/apis/utils';
import { stripUndefinedProps } from 'lib/utils';

import { templeWalletApi } from '../templewallet.api';

import {
  AlchemyChainID,
  AssetTransfersWithMetadataResult,
  AlchemyNftQueryFilters,
  ALCHEMY_NFT_EXCLUDE_SPAM,
  BaseNftsResponse,
  GetContractsForOwnerResponse,
  Log,
  NftsResponse,
  SomeNftsResponse
} from './alchemy';
import {
  BalancesResponse,
  GoldrushChainID,
  NftAddressBalanceNftResponse,
  Route3EvmRouteRequest,
  Route3EvmRoute,
  Route3EvmTokenWithPrice,
  RouteParams
} from './api.interfaces';
import {
  OpenseaNftDetailed,
  OpenseaNftRef,
  OpenseaChainID,
  OpenseaProfileCollectionResponse,
  OpenseaSearchResult
} from './opensea';

export type {
  GoldrushChainID,
  BalancesResponse,
  RouteParams,
  BalanceItem,
  BalanceNftData,
  NftCollectionAttribute,
  NftAddressBalanceNftResponse,
  NftTokenContractBalanceItem,
  NftData,
  Route3EvmRoute,
  Route3EvmTokenWithPrice
} from './api.interfaces';
export type { OpenseaNftDetailed, OpenseaNftRef } from './opensea';
export { ALCHEMY_NFT_EXCLUDE_SPAM };

/** May return NFTs that are not owned by the wallet, use only `includeNfts: true` for chains not supported by Alchemy */
export const getEvmBalances = (walletAddress: string, chainId: GoldrushChainID, includeNfts = false) =>
  buildEvmRequest<BalancesResponse>({ path: '/balances', walletAddress, chainId, params: { includeNfts } });

/** Response also contains exchange rates */
export const getEvmTokensMetadata = (walletAddress: string, chainId: GoldrushChainID) =>
  buildEvmRequest<BalancesResponse>({ path: '/tokens-metadata', walletAddress, chainId });

/** May return NFTs the wallet does not own. Used when Alchemy does not support the chain, and when Alchemy's owner list fails the ownership sample. */
export const getEvmCollectiblesMetadata = (walletAddress: string, chainId: GoldrushChainID, signal?: AbortSignal) =>
  buildEvmRequest<NftAddressBalanceNftResponse>({ path: '/collectibles-metadata', walletAddress, chainId, signal });

/** The multichain OpenSea metadata route rejects requests with more than 30 items. */
export const OPENSEA_MULTICHAIN_NFTS_LIMIT = 30;

export const getOpenseaMultichainNftsMetadata = (nftRefs: OpenseaNftRef[], signal?: AbortSignal) =>
  buildEvmRequest<Array<OpenseaNftDetailed | null>>({
    path: '/collectibles-v2/opensea/by-refs',
    method: 'post',
    body: nftRefs.slice(0, OPENSEA_MULTICHAIN_NFTS_LIMIT),
    signal
  });

export const getOpenseaChainNftsMetadata = (
  chainId: OpenseaChainID,
  walletAddress: string,
  collection?: string,
  next?: string,
  signal?: AbortSignal
) =>
  buildEvmRequest<{ nfts: OpenseaNftDetailed[]; next?: string | null }>({
    path: '/collectibles-v2/opensea/by-account',
    chainId,
    walletAddress,
    params: stripUndefinedProps({ collection, next }),
    signal
  });

/** Maximal limit is 100. */
export const getOpenseaAccountCollections = (
  chainIds: OpenseaChainID[],
  walletAddress: string,
  limit?: number,
  after?: string,
  signal?: AbortSignal
) =>
  buildEvmRequest<{ collections: OpenseaProfileCollectionResponse[]; next?: string | null }>({
    path: '/collectibles-v2/opensea/account-collections',
    walletAddress,
    params: stripUndefinedProps({ limit, after, chainIds }),
    signal
  });

export const getOpenseaSearchResults = (
  chainIds: OpenseaChainID[],
  query: string,
  limit?: number,
  assetTypes?: Array<'collection' | 'nft' | 'token' | 'account'>,
  signal?: AbortSignal
) =>
  buildEvmRequest<{ results: OpenseaSearchResult[] }>({
    path: '/collectibles-v2/opensea/search',
    params: stripUndefinedProps({ chainIds, query, limit, assetTypes }),
    signal
  });

/** `filters` accepts Alchemy's `orderBy`, `excludeFilters`, `includeFilters`, and `spamConfidenceLevel`. */
export const getNftAlchemyContractsByOwner = (
  chainId: AlchemyChainID,
  walletAddress: string,
  pageKey?: string,
  signal?: AbortSignal,
  filters: AlchemyNftQueryFilters = ALCHEMY_NFT_EXCLUDE_SPAM
) =>
  buildEvmRequest<GetContractsForOwnerResponse>({
    path: '/collectibles-v2/alchemy/owner-contracts',
    chainId,
    walletAddress,
    params: stripUndefinedProps({ pageKey, ...filters }),
    signal
  });

/** This entrypoint accepts up to 45 contract addresses. `filters` matches `getNftAlchemyContractsByOwner`. */
export function getAlchemyNftsByOwner(
  chainId: AlchemyChainID,
  walletAddress: string,
  withMetadata: false,
  pageKey?: string,
  contractAddresses?: string[],
  signal?: AbortSignal,
  filters?: AlchemyNftQueryFilters
): Promise<BaseNftsResponse>;
export function getAlchemyNftsByOwner(
  chainId: AlchemyChainID,
  walletAddress: string,
  withMetadata: true,
  pageKey?: string,
  contractAddresses?: string[],
  signal?: AbortSignal,
  filters?: AlchemyNftQueryFilters
): Promise<NftsResponse>;
export function getAlchemyNftsByOwner(
  chainId: AlchemyChainID,
  walletAddress: string,
  withMetadata: boolean,
  pageKey?: string,
  contractAddresses?: string[],
  signal?: AbortSignal,
  filters: AlchemyNftQueryFilters = ALCHEMY_NFT_EXCLUDE_SPAM
): Promise<SomeNftsResponse> {
  return buildEvmRequest<SomeNftsResponse>({
    path: '/collectibles-v2/alchemy/owner-nfts',
    chainId,
    walletAddress,
    params: stripUndefinedProps({ pageKey, contractAddresses, withMetadata, ...filters }),
    signal
  });
}

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
