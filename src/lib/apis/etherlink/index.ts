import { Semaphore } from 'async-mutex';
import axios from 'axios';

import { COMMON_MAINNET_CHAIN_IDS, COMMON_TESTNET_CHAIN_IDS } from 'lib/temple/types';

import { refetchOnce429 } from '../utils';

import { ETHERLINK_API_URLS } from './constants';
import {
  EtherlinkChainId,
  EtherlinkOperationsResponse,
  EtherlinkInternalTransactionsResponse,
  EtherlinkTokensTransfersResponse,
  ItemsWithPagination,
  EtherlinkPageParams,
  EtherlinkTokenBalance,
  EtherlinkTxLogsResponse
} from './types';

export * from './types';

const api = axios.create({
  adapter: 'fetch'
});
const apiSemaphores = {
  [COMMON_MAINNET_CHAIN_IDS.etherlink]: new Semaphore(10),
  [COMMON_TESTNET_CHAIN_IDS.etherlink]: new Semaphore(10)
};

async function fetchGet<R>(
  chainId: EtherlinkChainId,
  endpoint: string,
  params?: EtherlinkPageParams | null,
  signal?: AbortSignal
) {
  const [, release] = await apiSemaphores[chainId].acquire();
  setTimeout(release, 1000);

  const { data } = await api.get<R>(endpoint, {
    baseURL: ETHERLINK_API_URLS[chainId],
    params,
    signal
  });

  return data;
}

export const fetchGetAccountOperations = async (
  chainId: EtherlinkChainId,
  address: string,
  nextPageParams?: EtherlinkPageParams | null,
  signal?: AbortSignal
) =>
  fetchGet<EtherlinkOperationsResponse>(
    chainId,
    `/addresses/${address}/transactions`,
    nextPageParams ?? undefined,
    signal
  );

const fetchGetInternalTransactions = async (
  chainId: EtherlinkChainId,
  txHash: string,
  nextPageParams?: EtherlinkPageParams | null,
  signal?: AbortSignal
) =>
  fetchGet<EtherlinkInternalTransactionsResponse>(
    chainId,
    `/transactions/${txHash}/internal-transactions`,
    nextPageParams ?? undefined,
    signal
  );

const fetchGetInternalTokensTransfers = async (
  chainId: EtherlinkChainId,
  txHash: string,
  nextPageParams?: EtherlinkPageParams | null,
  signal?: AbortSignal
) =>
  fetchGet<EtherlinkTokensTransfersResponse>(
    chainId,
    `/transactions/${txHash}/token-transfers`,
    nextPageParams ?? undefined,
    signal
  );

const makeFetchAllPagesFn =
  <R, A extends unknown[]>(
    fetcher: (
      ...args: [...A, nextPageParams?: EtherlinkPageParams | null, signal?: AbortSignal]
    ) => Promise<ItemsWithPagination<R>>
  ) =>
  async (signal: AbortSignal | undefined, ...args: A) => {
    let nextPageParams: EtherlinkPageParams | null = null;
    let allItems: R[] = [];

    do {
      const { items, nextPageParams: newNextPageParams } = await refetchOnce429(() =>
        fetcher(...args, nextPageParams, signal)
      );
      allItems = allItems.concat(items);
      nextPageParams = newNextPageParams;
    } while (nextPageParams != null);

    return allItems;
  };

export const fetchAllInternalTransactions = makeFetchAllPagesFn(fetchGetInternalTransactions);
export const fetchAllInternalTokensTransfers = makeFetchAllPagesFn(fetchGetInternalTokensTransfers);

export const fetchGetTokensBalances = async (chainId: EtherlinkChainId, address: string, signal?: AbortSignal) =>
  fetchGet<EtherlinkTokenBalance[]>(chainId, `/addresses/${address}/tokens`, null, signal);

export const fetchGetTxLogs = async (
  chainId: EtherlinkChainId,
  txHash: string,
  nextPageParams?: EtherlinkPageParams | null,
  signal?: AbortSignal
) => fetchGet<EtherlinkTxLogsResponse>(chainId, `/transactions/${txHash}/logs`, nextPageParams ?? undefined, signal);
