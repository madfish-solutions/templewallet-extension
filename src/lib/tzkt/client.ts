import axios, { AxiosError } from "axios";
import { ThanosChainId } from "lib/thanos/types";
import {
  TzktGetOperationsParams,
  TzktOperation,
  TzktRelatedContract,
} from "./types";

const TZKT_API_BASE_URLS = new Map([
  [ThanosChainId.Mainnet, "https://api.tzkt.io/v1"],
  [ThanosChainId.Edonet, "https://api.edonet.tzkt.io/"],
  [ThanosChainId.Delphinet, "https://api.delphinet.tzkt.io/v1"],
  [ThanosChainId.Carthagenet, "https://api.carthagenet.tzkt.io/v1"],
]);

export const TZKT_BASE_URLS = new Map([
  [ThanosChainId.Mainnet, "https://tzkt.io"],
  [ThanosChainId.Edonet, "https://edonet.tzkt.io"],
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
