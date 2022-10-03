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

//// CHAIN ID

const TZKT_API_BASE_URLS = {
  [TempleChainId.Mainnet]: 'https://api.tzkt.io/v1',
  [TempleChainId.Jakartanet]: 'https://api.jakartanet.tzkt.io/v1',
  [TempleChainId.Ghostnet]: 'https://api.ghostnet.tzkt.io/v1',
  [TempleChainId.Dcp]: 'https://explorer.tlnt.net:8001/v1',
  [TempleChainId.DcpTest]: 'https://explorer.tlnt.net:8009/v1'
};

export const TZKT_API_BASE_URLS_MAP = new Map(Object.entries(TZKT_API_BASE_URLS) as [TempleChainId, string][]);

export type TzktApiChainId = keyof typeof TZKT_API_BASE_URLS;

const _KNOWN_CHAIN_IDS = Object.keys(TZKT_API_BASE_URLS);

export function isKnownChainId(chainId?: string | null): chainId is TzktApiChainId {
  return chainId != null && _KNOWN_CHAIN_IDS.includes(chainId);
}

//// AXIOS API

const api = axios.create();

api.interceptors.response.use(
  res => res,
  err => {
    console.error(err);
    const message = (err as AxiosError).response?.data?.message;
    console.error(`Failed when querying Tzkt API: ${message}`);
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

////

type GetOperationsBaseParams = {
  limit?: number;
  offset?: number;
} & {
  [key in `timestamp.${'lt' | 'ge'}`]?: string;
} & {
  [key in `level.${'lt' | 'ge'}`]?: number;
};

export function fetchGetAccountOperations(
  chainId: TzktApiChainId,
  accountAddress: string,
  params: GetOperationsBaseParams & {
    type?: TzktOperationType | TzktOperationType[];
    lastId?: number;
    sort?: 0 | 1;
    initiator?: string;
    entrypoint?: 'mintOrBurn';
    quote?: TzktQuoteCurrency[];
    'parameter.null'?: boolean;
  }
) {
  return fetchGet<TzktOperation[]>(chainId, `/accounts/${accountAddress}/operations`, params);
}

export function fetchGetOperationsByHash(
  chainId: TzktApiChainId,
  hash: string,
  params: {
    quote?: TzktQuoteCurrency[];
  } = {}
) {
  return fetchGet<TzktOperation[]>(chainId, `/operations/${hash}`, params);
}

type GetOperationsSortParamValueType = 'id' | 'level';

export function fetchGetOperationsTransactions(
  chainId: TzktApiChainId,
  params: GetOperationsBaseParams & {
    lastId?: number;
    'sender.ne'?: string;
    target?: string;
    'target.ne'?: string;
    'initiator.ne'?: string;
    'parameter.to'?: string;
    'parameter.[*].txs.[*].to_'?: string;
    'parameter.in'?: string;
    'parameter.[*].in'?: string;
    entrypoint?: 'transfer';
    sort?: GetOperationsSortParamValueType;
    'sort.desc'?: GetOperationsSortParamValueType;
  }
) {
  return fetchGet<TzktOperation[]>(chainId, `/operations/transactions`, params);
}

export async function getOneUserContracts(chainId: TempleChainId, accountAddress: string) {
  if (!isKnownChainId(chainId)) {
    return [];
  }

  return fetchGet<TzktRelatedContract[]>(chainId, `/accounts/${accountAddress}/contracts`);
}

export async function getDelegatorRewards(
  chainId: TempleChainId,
  { address, cycle = {}, sort, quote, ...restParams }: TzktGetRewardsParams
) {
  if (!isKnownChainId(chainId)) {
    throw Error('Unknown chain id');
  }

  return fetchGet<TzktGetRewardsResponse>(chainId, `/rewards/delegators/${address}`, {
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
}

export const TZKT_FETCH_QUERY_SIZE = 20;

export async function fetchTokenBalancesCount(chainId: string, accountAddress: string) {
  if (!isKnownChainId(chainId)) {
    return 0;
  }

  return fetchGet<number>(chainId, '/tokens/balances/count', {
    account: accountAddress,
    'token.metadata.artifactUri.null': true
  });
}

export async function fetchTokenBalances(chainId: string, accountAddress: string, page = 0) {
  if (!isKnownChainId(chainId)) {
    return [];
  }

  return fetchGet<TzktAccountTokenBalance[]>(chainId, '/tokens/balances', {
    account: accountAddress,
    limit: TZKT_FETCH_QUERY_SIZE,
    offset: page * TZKT_FETCH_QUERY_SIZE,
    'sort.desc': 'balance',
    'token.metadata.artifactUri.null': true
  });
}

export async function fetchNFTBalancesCount(chainId: string, accountAddress: string) {
  if (!isKnownChainId(chainId)) {
    return 0;
  }

  return fetchGet<number>(chainId, '/tokens/balances/count', {
    account: accountAddress,
    'token.metadata.artifactUri.null': false
  });
}

export async function fetchNFTBalances(chainId: string, accountAddress: string, page = 0) {
  if (!isKnownChainId(chainId)) {
    return [];
  }

  return fetchGet<TzktAccountTokenBalance[]>(chainId, '/tokens/balances', {
    account: accountAddress,
    limit: TZKT_FETCH_QUERY_SIZE,
    offset: page * TZKT_FETCH_QUERY_SIZE,
    'sort.desc': 'balance',
    'token.metadata.artifactUri.null': false
  });
}

export async function refetchOnce429<R>(fetcher: () => Promise<R>, delayAroundInMS = 1000) {
  try {
    return await fetcher();
  } catch (err: any) {
    if (err.isAxiosError) {
      const error: AxiosError = err;
      if (error.response?.status === 429) {
        await delay(delayAroundInMS);
        const res = await fetcher();
        await delay(delayAroundInMS);
        return res;
      }
    }

    throw err;
  }
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
