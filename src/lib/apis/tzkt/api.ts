import { HubConnectionBuilder } from '@microsoft/signalr';
import { isDefined } from '@rnw-community/shared';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';

import { toTokenSlug } from 'lib/assets';
import { isTezosDcpChainId } from 'temple/networks';

import { TZKT_API_BASE_URLS } from './misc';
import {
  TzktOperation,
  TzktOperationType,
  TzktQuoteCurrency,
  TzktAccountAsset,
  TzktTokenTransfer,
  allInt32ParameterKeys,
  TzktGetRewardsParams,
  TzktGetRewardsResponse,
  TzktAccount,
  TzktHubConnection,
  TzktCycle,
  TzktProtocol,
  TzktSetDelegateParamsOperation,
  TzktOperationRole,
  TzktBalanceHistoryItem,
  TzktGetBalanceHistoryParams,
  TzktStakingUpdate
} from './types';
import { calcTzktAccountSpendableTezBalance } from './utils';

export type TzktApiChainId = keyof typeof TZKT_API_BASE_URLS;

const KNOWN_CHAIN_IDS = Object.keys(TZKT_API_BASE_URLS);

export function isKnownChainId(chainId?: string | null): chainId is TzktApiChainId {
  return chainId != null && KNOWN_CHAIN_IDS.includes(chainId);
}

export const createTzktWsConnection = (chainId: TzktApiChainId): TzktHubConnection | null =>
  isTezosDcpChainId(chainId) ? null : new HubConnectionBuilder().withUrl(`${TZKT_API_BASE_URLS[chainId]}/ws`).build();

const api = axios.create({
  adapter: 'fetch'
});

api.interceptors.response.use(
  res => res,
  err => {
    const message = (err as AxiosError)?.message;
    console.error(`Failed when querying Tzkt API: ${message}`, err);
    throw err;
  }
);

async function fetchGet<R>(
  chainId: TzktApiChainId,
  endpoint: string,
  params?: Record<string, unknown>,
  config?: AxiosRequestConfig
) {
  const { data } = await api.get<R>(endpoint, {
    baseURL: TZKT_API_BASE_URLS[chainId],
    params,
    ...config
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
  params: {
    limit?: number;
    lastId?: number;
    roles?: TzktOperationRole[];
    types?: TzktOperationType[];
    sort?: 0 | 1;
    quote?: TzktQuoteCurrency[];
  } & {
    [key in `timestamp.${'lt' | 'ge'}`]?: string;
  }
) =>
  fetchGet<TzktOperation[]>(chainId, '/accounts/activity', {
    ...params,
    addresses: accountAddress,
    ...joinArrayParam('roles', params.roles),
    ...joinArrayParam('types', params.types),
    ...joinArrayParam('quote', params.quote)
  });

const joinArrayParam = (key: string, param?: string[]) => (isDefined(param) ? { [key]: param.join(',') } : {});

export const fetchGetOperationsByHash = (
  chainId: TzktApiChainId,
  hash: string,
  params: {
    quote?: TzktQuoteCurrency[];
  } = {}
) => fetchGet<TzktOperation[]>(chainId, `/operations/${hash}`, params);

type OperationSortParams = {
  [key in `sort${'' | '.desc'}`]?: 'id' | 'level';
};

type GetOperationsTransactionsParams = GetOperationsBaseParams & {
  [key in `anyof.sender.target${'' | '.initiator'}`]?: string;
} & {
  [key in `amount${'' | '.ne'}`]?: string;
} & {
  [key in `parameter.${'to' | 'in' | '[*].in' | '[*].txs.[*].to_'}`]?: string;
} & OperationSortParams;

export const fetchGetOperationsTransactions = (chainId: TzktApiChainId, params: GetOperationsTransactionsParams) =>
  fetchGet<TzktOperation[]>(chainId, `/operations/transactions`, params);

export const fetchSetDelegateParametersOperations = (
  chainId: TzktApiChainId,
  params: GetOperationsBaseParams & OperationSortParams
) => fetchGet<TzktSetDelegateParamsOperation[]>(chainId, '/operations/set_delegate_parameters', params);

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

export const getCycles = (chainId: TzktApiChainId, offset?: number, limit?: number) =>
  fetchGet<TzktCycle[]>(chainId, '/cycles', { offset, limit });

export const getProtocol = (chainId: TzktApiChainId) => fetchGet<TzktProtocol>(chainId, '/protocols/current');

export const getProtocolByCycle = (chainId: TzktApiChainId, cycle: number) =>
  fetchGet<TzktProtocol>(chainId, `/protocols/cycles/${cycle}`);

/**
 * @arg fungible // `null` for unknown fungibility only
 */
export function fetchTzktAccountAssets(account: string, chainId: string, fungible: boolean | null) {
  if (!isKnownChainId(chainId)) return Promise.resolve([]);

  const recurse = async (
    accum: TzktAccountAssetSelectedParams[],
    offset: number
  ): Promise<TzktAccountAssetSelectedParams[]> => {
    const data = await fetchTzktAccountAssetsPage(account, chainId, offset, fungible);

    if (!data.length) return accum;

    if (data.length === TZKT_MAX_QUERY_ITEMS_LIMIT)
      return recurse(accum.concat(data), offset + TZKT_MAX_QUERY_ITEMS_LIMIT);

    return accum.concat(data);
  };

  return recurse([], 0);
}

export type TzktAccountAssetSelectedParams = [
  contractAddress: TzktAccountAsset['token']['contract']['address'],
  tokenId: TzktAccountAsset['token']['tokenId'],
  balance: TzktAccountAsset['balance']
];

const fetchTzktAccountAssetsPage = (
  account: string,
  chainId: TzktApiChainId,
  offset?: number,
  fungible: boolean | null = null
) =>
  fetchGet<TzktAccountAssetSelectedParams[]>(chainId, '/tokens/balances', {
    account,
    limit: TZKT_MAX_QUERY_ITEMS_LIMIT,
    offset,
    'balance.gt': 0,
    ...(fungible === null
      ? { 'token.metadata.null': true }
      : {
          'token.metadata.artifactUri.null': fungible
        }),
    'sort.desc': 'balance',
    'select.values': 'token.contract.address,token.tokenId,balance'
  });

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

export const fetchTokenTransfers = (chainId: TzktApiChainId, params: Record<string, any>, signal?: AbortSignal) =>
  fetchGet<TzktTokenTransfer[]>(chainId, '/tokens/transfers', params, { signal });

export const fetchAccountBalanceHistory = (
  chainId: TzktApiChainId,
  accountAddress: string,
  params: TzktGetBalanceHistoryParams = {},
  signal?: AbortSignal
) =>
  fetchGet<TzktBalanceHistoryItem[]>(
    chainId,
    `/accounts/${accountAddress}/balance_history`,
    {
      ...params,
      'sort.asc': 'level'
    },
    {
      signal
    }
  );

export interface TzktGetStakingUpdatesParams {
  staker?: string;
  baker?: string;
  offset?: number;
}

export const fetchStakingUpdates = (
  chainId: TzktApiChainId,
  params: TzktGetStakingUpdatesParams,
  signal?: AbortSignal
) =>
  fetchGet<TzktStakingUpdate[]>(
    chainId,
    '/staking/updates',
    {
      ...params,
      limit: TZKT_MAX_QUERY_ITEMS_LIMIT
    },
    { signal }
  );
