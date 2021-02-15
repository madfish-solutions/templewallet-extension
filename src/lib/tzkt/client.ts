import axios, { AxiosError } from "axios";
import { ThanosChainId } from "lib/thanos/types";
import {
  allInt32ParameterKeys,
  TzktGetOperationsParams,
  TzktGetRewardsParams,
  TzktGetRewardsResponse,
  TzktOperation,
  TzktRelatedContract,
} from "lib/tzkt/types";

const TZKT_API_BASE_URLS = new Map([
  [ThanosChainId.Mainnet, "https://api.tzkt.io/v1"],
  [ThanosChainId.Edo2net, "https://api.edo2net.tzkt.io/"],
  [ThanosChainId.Delphinet, "https://api.delphinet.tzkt.io/v1"],
  [ThanosChainId.Carthagenet, "https://api.carthagenet.tzkt.io/v1"],
]);

export const TZKT_BASE_URLS = new Map([
  [ThanosChainId.Mainnet, "https://tzkt.io"],
  [ThanosChainId.Edo2net, "https://edo2net.tzkt.io"],
  [ThanosChainId.Delphinet, "https://delphinet.tzkt.io"],
  [ThanosChainId.Carthagenet, "https://carthagenet.tzkt.io"],
]);

const api = axios.create();
api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error(err);
    const { message } = (err as AxiosError).response?.data;
    throw new Error(`Failed when querying Tzkt API: ${message}`);
  }
);

export const getOperations = makeQuery<
  TzktGetOperationsParams,
  TzktOperation[]
>(
  (params) => `/accounts/${params.address}/operations`,
  ({ address, type, quote, ...restParams }) => ({
    type: (type || ["delegation", "transaction", "reveal"]).join(","),
    quote: quote?.join(","),
    ...restParams,
  })
);

type GetUserContractsParams = {
  account: string;
};

export const getOneUserContracts = makeQuery<
  GetUserContractsParams,
  TzktRelatedContract[]
>(
  ({ account }) => `/accounts/${account}/contracts`,
  () => ({})
);

export const getDelegatorRewards = makeQuery<
  TzktGetRewardsParams,
  TzktGetRewardsResponse
>(
  ({ address }) => `/rewards/delegators/${address}`,
  ({ cycle = {}, sort, quote, ...restParams }) => ({
    ...allInt32ParameterKeys.reduce(
      (cycleParams, key) => ({
        ...cycleParams,
        [`cycle.${key}`]: cycle[key],
      }),
      {}
    ),
    ...(sort ? { [`sort.${sort}`]: "cycle" } : {}),
    quote: quote?.join(","),
    ...restParams,
  })
);

function makeQuery<P extends Record<string, unknown>, R>(
  url: (params: P) => string,
  searchParams: (params: P) => Record<string, unknown>
) {
  return async (chainId: ThanosChainId, params: P) => {
    const { data } = await api.get<R>(url(params), {
      baseURL: TZKT_API_BASE_URLS.get(chainId),
      params: searchParams(params),
    });

    return data;
  };
}
