import { Semaphore } from 'async-mutex';
import axios from 'axios';

import { COMMON_MAINNET_CHAIN_IDS, COMMON_TESTNET_CHAIN_IDS } from 'lib/temple/types';

import { refetchOnce429 } from '../utils';

import { ETHERLINK_API_URLS } from './constants';
import {
  EtherlinkChainId,
  EtherlinkOperationsResponse,
  EtherlinkInternalTxsResponse,
  EtherlinkTokensTransfersResponse,
  ItemsWithPagination,
  EtherlinkTokenBalance,
  EtherlinkTxLogsResponse,
  EtherlinkAccountInfo,
  EtherlinkAccountNftsResponse,
  EtherlinkCoinBalanceHistoryResponse
} from './types';

export {
  type EtherlinkAddressNftInstance,
  type EtherlinkChainId,
  type EtherlinkInternalTx,
  type EtherlinkTransaction,
  type EtherlinkOperationsPageParams,
  type EtherlinkTokenTransfersPageParams,
  type EtherlinkTokenTransfer,
  isEtherlinkSupportedChainId,
  isErc20TokenBalance,
  isErc20TokenTransfer,
  isErc721TokenTransfer
} from './types';

const api = axios.create({
  adapter: 'fetch'
});
const apiSemaphores = {
  [COMMON_MAINNET_CHAIN_IDS.etherlink]: new Semaphore(10),
  [COMMON_TESTNET_CHAIN_IDS.etherlink]: new Semaphore(10)
};

interface FetchGetParams<P extends object> {
  chainId: EtherlinkChainId;
  endpoint: string;
  pageParams?: P | null;
  signal?: AbortSignal;
}
async function fetchGet<R, P extends object>({ chainId, endpoint, pageParams, signal }: FetchGetParams<P>) {
  const [, release] = await apiSemaphores[chainId].acquire();
  setTimeout(release, 1000);

  const { data } = await api.get<R>(endpoint, {
    baseURL: ETHERLINK_API_URLS[chainId],
    params: pageParams,
    signal
  });

  return data;
}

type ItemsWithObjectPagination = ItemsWithPagination<unknown, object>;
type PageParams<T extends ItemsWithObjectPagination> = T extends ItemsWithPagination<unknown, infer P> ? P : never;

interface GetterParamsBase<R extends ItemsWithObjectPagination> {
  chainId: EtherlinkChainId;
  pageParams?: PageParams<R> | null;
  signal?: AbortSignal;
}
type GetterParams<A extends object, R extends ItemsWithObjectPagination> = GetterParamsBase<R> &
  Omit<A, keyof GetterParamsBase<R>>;

type ItemsPageGetter<A extends object, R extends ItemsWithPagination<unknown, object>> = (
  params: GetterParams<A, R>
) => Promise<R>;

const makeItemsPageGetter =
  <A extends object, R extends ItemsWithObjectPagination>(
    makeEndpointUrl: (params: GetterParams<A, R>) => string
  ): ItemsPageGetter<A, R> =>
  params => {
    const { chainId, pageParams, signal } = params;
    const endpointUrl = makeEndpointUrl(params);

    return fetchGet<R, PageParams<R>>({ chainId, endpoint: endpointUrl, pageParams, signal });
  };
const makeItemsPageGetterByAddress = <R extends ItemsWithObjectPagination>(
  makeEndpointUrl: (address: string) => string
) => makeItemsPageGetter<{ address: string }, R>(({ address }) => makeEndpointUrl(address));
const makeItemsPageGetterByTxHash = <R extends ItemsWithObjectPagination>(
  makeEndpointUrl: (txHash: string) => string
) => makeItemsPageGetter<{ txHash: string }, R>(({ txHash }) => makeEndpointUrl(txHash));

export const fetchGetAccountOperations = makeItemsPageGetterByAddress<EtherlinkOperationsResponse>(
  address => `/addresses/${address}/transactions`
);

const fetchGetInternalTransactions = makeItemsPageGetterByTxHash<EtherlinkInternalTxsResponse>(
  txHash => `/transactions/${txHash}/internal-transactions`
);

export const fetchGetTokensTransfers = makeItemsPageGetterByAddress<EtherlinkTokensTransfersResponse>(
  address => `/addresses/${address}/token-transfers`
);

const fetchGetAccountNfts = makeItemsPageGetterByAddress<EtherlinkAccountNftsResponse>(
  address => `/addresses/${address}/nft`
);

export const fetchGetCoinBalanceHistory = makeItemsPageGetterByAddress<EtherlinkCoinBalanceHistoryResponse>(
  address => `/addresses/${address}/coin-balance-history`
);

const fetchGetInternalTokensTransfers = makeItemsPageGetterByTxHash<EtherlinkTokensTransfersResponse>(
  txHash => `/transactions/${txHash}/token-transfers`
);

const fetchGetTxLogs = makeItemsPageGetterByTxHash<EtherlinkTxLogsResponse>(txHash => `/transactions/${txHash}/logs`);

const makeFetchAllPagesFn =
  <T, A extends object, P extends object>(pageGetter: ItemsPageGetter<A, ItemsWithPagination<T, P>>) =>
  async (params: A & Omit<GetterParamsBase<ItemsWithPagination<T, P>>, 'pageParams'>) => {
    let nextPageParams: P | null = null;
    let allItems: T[] = [];

    do {
      const { items, next_page_params: newNextPageParams } = await refetchOnce429(() =>
        pageGetter({ ...params, pageParams: nextPageParams })
      );
      allItems = allItems.concat(items);
      nextPageParams = newNextPageParams;
    } while (nextPageParams != null);

    return allItems;
  };

export const fetchAllInternalTransactions = makeFetchAllPagesFn(fetchGetInternalTransactions);
export const fetchAllInternalTokensTransfers = makeFetchAllPagesFn(fetchGetInternalTokensTransfers);
export const fetchAllAccountNfts = makeFetchAllPagesFn(fetchGetAccountNfts);
export const fetchAllTxLogs = makeFetchAllPagesFn(fetchGetTxLogs);

export const fetchGetTokensBalances = (chainId: EtherlinkChainId, address: string, signal?: AbortSignal) =>
  fetchGet<EtherlinkTokenBalance[], never>({ chainId, endpoint: `/addresses/${address}/token-balances`, signal });

export const fetchGetAccountInfo = async (chainId: EtherlinkChainId, address: string, signal?: AbortSignal) =>
  fetchGet<EtherlinkAccountInfo, never>({ chainId, endpoint: `/addresses/${address}`, signal });
