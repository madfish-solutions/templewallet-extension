import { HubConnectionBuilder } from '@microsoft/signalr';
import axios, { AxiosError } from 'axios';

import { toTokenSlug } from 'lib/assets';
import { TempleChainId } from 'lib/temple/types';
import { delay } from 'lib/utils';

import {
  TzktOperation,
  TzktOperationType,
  TzktQuoteCurrency,
  TzktAccountAsset,
  allInt32ParameterKeys,
  TzktGetRewardsParams,
  TzktGetRewardsResponse,
  TzktRelatedContract,
  TzktAccount,
  TzktHubConnection
} from './types';
import { calcTzktAccountSpendableTezBalance } from './utils';

const TZKT_API_BASE_URLS = {
  [TempleChainId.Mainnet]: 'https://api.tzkt.io/v1',
  [TempleChainId.Mumbai]: 'https://api.mumbainet.tzkt.io/v1',
  [TempleChainId.Nairobi]: 'https://api.nairobinet.tzkt.io/v1',
  [TempleChainId.Ghostnet]: 'https://api.ghostnet.tzkt.io/v1',
  [TempleChainId.Dcp]: 'https://explorer-api.tlnt.net/v1',
  [TempleChainId.DcpTest]: 'https://explorer-api.test.tlnt.net/v1'
};

export type TzktApiChainId = keyof typeof TZKT_API_BASE_URLS;

const KNOWN_CHAIN_IDS = Object.keys(TZKT_API_BASE_URLS);

export function isKnownChainId(chainId?: string | null): chainId is TzktApiChainId {
  return chainId != null && KNOWN_CHAIN_IDS.includes(chainId);
}

export const createWsConnection = (chainId: string): TzktHubConnection | undefined => {
  if (isKnownChainId(chainId)) {
    return new HubConnectionBuilder().withUrl(`${TZKT_API_BASE_URLS[chainId]}/ws`).build();
  }

  return undefined;
};

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
) =>
  fetchGet<TzktOperation[]>(chainId, `/accounts/${accountAddress}/operations`, {
    ...params,
    type: Array.isArray(params.type) ? params.type.join(',') : params.type
  });

export const fetchGetOperationsByHash = (
  chainId: TzktApiChainId,
  hash: string,
  params: {
    quote?: TzktQuoteCurrency[];
  } = {}
) => fetchGet<TzktOperation[]>(chainId, `/operations/${hash}`, params);

type GetOperationsTransactionsParams = GetOperationsBaseParams & {
  [key in `anyof.sender.target${'' | '.initiator'}`]?: string;
} & {
  [key in `amount${'' | '.ne'}`]?: string;
} & {
  [key in `parameter.${'to' | 'in' | '[*].in' | '[*].txs.[*].to_'}`]?: string;
} & {
  [key in `sort${'' | '.desc'}`]?: 'id' | 'level';
};

export const fetchGetOperationsTransactions = (chainId: TzktApiChainId, params: GetOperationsTransactionsParams) =>
  fetchGet<TzktOperation[]>(chainId, `/operations/transactions`, params);

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

const TZKT_MAX_QUERY_ITEMS_LIMIT = 10_000;

/**
 * @arg fungible // `null` for unknown fungibility only
 */
export function fetchTzktAccountAssets(account: string, chainId: string, fungible: boolean | null) {
  if (!isKnownChainId(chainId)) return Promise.resolve([]);

  const recurse = async (accum: TzktAccountAsset[], offset: number): Promise<TzktAccountAsset[]> => {
    const data = await fetchTzktAccountAssetsPage(account, chainId, offset, fungible);

    if (!data.length) return accum;

    if (data.length === TZKT_MAX_QUERY_ITEMS_LIMIT)
      return recurse(accum.concat(data), offset + TZKT_MAX_QUERY_ITEMS_LIMIT);

    return accum.concat(data);
  };

  return recurse([], 0);
}

const fetchTzktAccountAssetsPage = (
  account: string,
  chainId: TzktApiChainId,
  offset?: number,
  fungible: boolean | null = null
) =>
  fetchGet<TzktAccountAsset[]>(chainId, '/tokens/balances', {
    account,
    limit: TZKT_MAX_QUERY_ITEMS_LIMIT,
    offset,
    'balance.gt': 0,
    ...(fungible === null
      ? { 'token.metadata.null': true }
      : {
          'token.metadata.artifactUri.null': fungible
        }),
    'sort.desc': 'balance'
  });

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

export const fetchTezosBalanceFromTzkt = async (account: string, chainId: TzktApiChainId) =>
  getAccountStatsFromTzkt(account, chainId).then(calcTzktAccountSpendableTezBalance);

export const fetchAllAssetsBalancesFromTzkt = async (account: string, chainId: TzktApiChainId) => {
  const balances: StringRecord = {};

  await (async function recourse(offset: number) {
    const data = await fetchAssetsBalancesFromTzktOnce(account, chainId, offset);

    for (const [address, tokenId, balance] of data) {
      const slug = toTokenSlug(address, tokenId);
      balances[slug] = balance;
    }

    if (data.length === TZKT_MAX_QUERY_ITEMS_LIMIT) {
      await recourse(offset + TZKT_MAX_QUERY_ITEMS_LIMIT);
    }
  })(0);

  return balances;
};

type AssetBalance = [address: string, tokenId: string, balance: string];

const fetchAssetsBalancesFromTzktOnce = (account: string, chainId: TzktApiChainId, offset = 0) =>
  fetchGet<AssetBalance[]>(chainId, '/tokens/balances', {
    account,
    limit: TZKT_MAX_QUERY_ITEMS_LIMIT,
    offset,
    'select.values': 'token.contract.address,token.tokenId,balance'
  });

export const getAccountStatsFromTzkt = async (account: string, chainId: TzktApiChainId) =>
  fetchGet<TzktAccount>(chainId, `/accounts/${account}`);
