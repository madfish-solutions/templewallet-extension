import axios, { AxiosError } from 'axios';

import { TempleChainId } from 'lib/temple/types';
import {
  allInt32ParameterKeys,
  TzktGetOperationsParams,
  TzktGetRewardsParams,
  TzktGetRewardsResponse,
  TzktOperation,
  TzktRelatedContract
} from 'lib/tzkt/types';

export const TZKT_API_BASE_URLS = new Map([
  [TempleChainId.Mainnet, 'https://api.tzkt.io/v1'],
  [TempleChainId.Granadanet, 'https://api.granadanet.tzkt.io/v1'],
  [TempleChainId.Hangzhounet, 'https://api.hangzhou2net.tzkt.io/v1']
]);

const api = axios.create();
api.interceptors.response.use(
  res => res,
  err => {
    console.error(err);
    const { message } = (err as AxiosError).response?.data;
    throw new Error(`Failed when querying Tzkt API: ${message}`);
  }
);

export const getOperations = makeQuery<TzktGetOperationsParams, TzktOperation[]>(
  params => `/accounts/${params.address}/operations`,
  ({ address, type, quote, from, to, ...restParams }) => ({
    type: type?.join(','),
    quote: quote?.join(','),
    'timestamp.ge': from,
    'timestamp.lt': to,
    ...restParams
  })
);

type GetUserContractsParams = {
  account: string;
};

export const getOneUserContracts = makeQuery<GetUserContractsParams, TzktRelatedContract[]>(
  ({ account }) => `/accounts/${account}/contracts`,
  () => ({})
);

export const getDelegatorRewards = makeQuery<TzktGetRewardsParams, TzktGetRewardsResponse>(
  ({ address }) => `/rewards/delegators/${address}`,
  ({ cycle = {}, sort, quote, ...restParams }) => ({
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
  })
);

function makeQuery<P extends Record<string, unknown>, R>(
  url: (params: P) => string,
  searchParams: (params: P) => Record<string, unknown>
) {
  return async (chainId: TempleChainId, params: P) => {
    const { data } = await api.get<R>(url(params), {
      baseURL: TZKT_API_BASE_URLS.get(chainId),
      params: searchParams(params)
    });

    return data;
  };
}
