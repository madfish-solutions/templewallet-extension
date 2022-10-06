import axios, { AxiosError } from 'axios';

import { TempleChainId } from 'lib/temple/types';

import {
  TzktOperation,
  TzktOperationType,
  TzktQuoteCurrency,
  TzktAccountTokenBalance,
  allInt32ParameterKeys,
  TzktGetRewardsParams,
  TzktGetRewardsResponse,
  TzktRelatedContract
} from './types';

const TZKT_API_BASE_URLS = {
  [TempleChainId.Mainnet]: 'https://api.tzkt.io/v1',
  [TempleChainId.Jakartanet]: 'https://api.jakartanet.tzkt.io/v1',
  [TempleChainId.Ghostnet]: 'https://api.ghostnet.tzkt.io/v1',
  [TempleChainId.Dcp]: 'https://explorer.tlnt.net:8001/v1',
  [TempleChainId.DcpTest]: 'https://explorer.tlnt.net:8009/v1'
};

export type TzktApiChainId = keyof typeof TZKT_API_BASE_URLS;

const KNOWN_CHAIN_IDS = Object.keys(TZKT_API_BASE_URLS);

export function isKnownChainId(chainId?: string | null): chainId is TzktApiChainId {
  return chainId != null && KNOWN_CHAIN_IDS.includes(chainId);
}

const api = axios.create();

api.interceptors.response.use(
  res => res,
  err => {
    const message = (err as AxiosError).response?.data?.message;
    console.error(`Failed when querying Tzkt API: ${message}`, err);
    throw err;
  }
);

async function fetchGet<R>(chainId: TzktApiChainId, endpoint: string, params?: Record<string, unknown>) {
  const { data } = await api.get<R>(endpoint, {
    baseURL: TZKT_API_BASE_URLS[chainId],
    params
  });

  return data;
}

type GetOperationsBaseParams = {
  limit?: number;
  offset?: number;
  entrypoint?: 'transfer' | 'mintOrBurn';
  lastId?: number;
} & {
  [key in `timestamp.${'lt' | 'ge'}`]?: string;
} & {
  [key in `level.${'lt' | 'ge'}`]?: number;
} & {
  [key in `target${'' | '.ne'}`]?: string;
} & {
  [key in `sender${'' | '.ne'}`]?: string;
} & {
  [key in `initiator${'' | '.ne'}`]?: string;
};

export const fetchGetAccountOperations = (
  chainId: TzktApiChainId,
  accountAddress: string,
  params: GetOperationsBaseParams & {
    type?: TzktOperationType | TzktOperationType[];
    sort?: 0 | 1;
    quote?: TzktQuoteCurrency[];
    'parameter.null'?: boolean;
  }
) => fetchGet<TzktOperation[]>(chainId, `/accounts/${accountAddress}/operations`, params);

export const fetchGetOperationsByHash = (
  chainId: TzktApiChainId,
  hash: string,
  params: {
    quote?: TzktQuoteCurrency[];
  } = {}
) => fetchGet<TzktOperation[]>(chainId, `/operations/${hash}`, params);

type GetOperationsTransactionsParameterParams = {
  [key in `parameter.${'to' | 'in' | '[*].in' | '[*].txs.[*].to_'}`]?: string;
};
type GetOperationsTransactionsSortParams = {
  [key in `sort${'' | '.desc'}`]?: 'id' | 'level';
};

export const fetchGetOperationsTransactions = (
  chainId: TzktApiChainId,
  params: GetOperationsBaseParams & GetOperationsTransactionsParameterParams & GetOperationsTransactionsSortParams
) => fetchGet<TzktOperation[]>(chainId, `/operations/transactions`, params);

export const getOneUserContracts = (chainId: TzktApiChainId, accountAddress: string) =>
  fetchGet<TzktRelatedContract[]>(chainId, `/accounts/${accountAddress}/contracts`);

export const getDelegatorRewards = (
  chainId: TzktApiChainId,
  { address, cycle = {}, sort, quote, ...restParams }: TzktGetRewardsParams
) =>
  fetchGet<TzktGetRewardsResponse>(chainId, `/rewards/delegators/${address}`, {
    ...allInt32ParameterKeys.reduce(
      (cycleParams, key) => ({
        ...cycleParams,
        [`cycle.${key}`]: cycle[key]
      }),
      {}
    ),
    ...(sort ? { [`sort.${sort}`]: 'cycle' } : {}),
    quote: quote?.join(','),
    ...restParams
  });

export const TZKT_FETCH_QUERY_SIZE = 20;

export const fetchTokenBalancesCount = async (chainId: string, accountAddress: string) =>
  isKnownChainId(chainId)
    ? await fetchGet<number>(chainId, '/tokens/balances/count', {
        account: accountAddress,
        'token.metadata.artifactUri.null': true
      })
    : 0;

export const fetchTokenBalances = async (chainId: string, accountAddress: string, page = 0) =>
  isKnownChainId(chainId)
    ? await fetchGet<TzktAccountTokenBalance[]>(chainId, '/tokens/balances', {
        account: accountAddress,
        limit: TZKT_FETCH_QUERY_SIZE,
        offset: page * TZKT_FETCH_QUERY_SIZE,
        'sort.desc': 'balance',
        'token.metadata.artifactUri.null': true
      })
    : [];

export const fetchNFTBalancesCount = async (chainId: string, accountAddress: string) =>
  isKnownChainId(chainId)
    ? await fetchGet<number>(chainId, '/tokens/balances/count', {
        account: accountAddress,
        'token.metadata.artifactUri.null': false
      })
    : 0;

export const fetchNFTBalances = async (chainId: string, accountAddress: string, page = 0) =>
  isKnownChainId(chainId)
    ? await fetchGet<TzktAccountTokenBalance[]>(chainId, '/tokens/balances', {
        account: accountAddress,
        limit: TZKT_FETCH_QUERY_SIZE,
        offset: page * TZKT_FETCH_QUERY_SIZE,
        'sort.desc': 'balance',
        'token.metadata.artifactUri.null': false
      })
    : [];

export async function refetchOnce429<R>(fetcher: () => Promise<R>, delayAroundInMS = 1000) {
  try {
    return await fetcher();
  } catch (err: any) {
    if (err.isAxiosError) {
      const error: AxiosError = err;
      if (error.response?.status === 429) {
        await sleep(delayAroundInMS);
        const res = await fetcher();
        await sleep(delayAroundInMS);
        return res;
      }
    }

    throw err;
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
