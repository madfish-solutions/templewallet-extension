import axios, { AxiosError } from "axios";
import { TzktGetOperationsParams, TzktOperation, TzktNetwork } from "./types";

const baseUrls: Record<TzktNetwork, string> = {
  mainnet: "https://api.tzkt.io",
  carthagenet: "https://api.carthage.tzkt.io",
  babylonnet: "https://api.babylon.tzkt.io",
  zeronet: "https://api.zeronet.tzkt.io",
  delphinet: "https://api.delphi.tzkt.io",
};

const api = axios.create();
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const { message } = (err as AxiosError).response?.data;
    throw new Error(`Failed when querying Tzkt API: ${message}`);
  }
);

export const getOperations = makeQuery<
  TzktGetOperationsParams,
  TzktOperation[]
>(
  (params) => `/accounts/${params.address}/operations`,
  ({ type, quote, ...restParams }) => ({
    type: (type || ["delegation", "transaction", "reveal"]).join(","),
    quote: quote?.join(","),
    ...restParams,
  })
);

function makeQuery<P extends Record<string, unknown>, R>(
  url: (params: P) => string,
  searchParams: (params: P) => Record<string, unknown>
) {
  return (network: TzktNetwork, params: P) => {
    return api.get<R>(url(params), {
      baseURL: baseUrls[network],
      params: searchParams,
    });
  };
}
