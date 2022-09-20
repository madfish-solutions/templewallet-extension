import axios, { AxiosError } from 'axios';

import { TempleChainId } from 'lib/temple/types';

import type { TzktOperation, TzktOperationType, TzktQuoteCurrency } from './types';

//// CHAIN ID

export const TZKT_API_BASE_URLS = {
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

export async function fetchGet<R>(chainId: TzktApiChainId, endpoint: string, params: Record<string, unknown>) {
  const { data } = await api.get<R>(endpoint, {
    baseURL: TZKT_API_BASE_URLS[chainId],
    params
  });

  return data;
}

export function makeQuery<P extends Record<string, unknown>, R, Q = Record<string, unknown>>(
  url: (params: P) => string,
  searchParams: (params: P) => Q
) {
  return async (chainId: TempleChainId, params: P) => {
    const { data } = await api.get<R>(url(params), {
      baseURL: TZKT_API_BASE_URLS_MAP.get(chainId),
      params: searchParams(params)
    });

    return data;
  };
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

export async function fetchGetAccountOperations(
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
  return await fetchGet<TzktOperation[]>(chainId, `/accounts/${accountAddress}/operations`, params);
}

export async function fetchGetOperationsByHash(
  chainId: TzktApiChainId,
  hash: string,
  params: {
    quote?: TzktQuoteCurrency[];
  } = {}
) {
  return await fetchGet<TzktOperation[]>(chainId, `/operations/${hash}`, params);
}

type GetOperationsSortParamValueType = 'id' | 'level';

export async function fetchGetOperationsTransactions(
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
  type TzktTransactionOperation = TzktOperation; // (?) Can it be narrowed down for this endpoint?

  return await fetchGet<TzktTransactionOperation[]>(chainId, `/operations/transactions`, params);
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
