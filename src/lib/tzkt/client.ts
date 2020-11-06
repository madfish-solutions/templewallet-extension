import axios, { AxiosError } from "axios";
import {
  TzktGetOperationsParams,
  TzktOperation,
  TzktNetwork,
  isValidTzktNetwork,
  TzktRelatedContract,
} from "./types";

const baseUrls: Record<TzktNetwork, string> = {
  mainnet: "https://api.tzkt.io/v1",
  carthagenet: "https://api.carthage.tzkt.io/v1",
  babylonnet: "https://api.babylon.tzkt.io/v1",
  zeronet: "https://api.zeronet.tzkt.io/v1",
  delphinet: "https://api.delphi.tzkt.io/v1",
};

export const TZKT_BASE_URLS = new Map([
  ["NetXdQprcVkpaWU", "https://tzkt.io"],
  ["NetXjD3HPJJjmcd", "https://carthage.tzkt.io"],
  ["NetXm8tYqnMWky1", "https://delphi.tzkt.io"],
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

const getUserContracts = makeQuery<
  GetUserContractsParams,
  TzktRelatedContract[]
>(
  ({ account }) => `/accounts/${account}/contracts`,
  () => ({})
);

export const getUsersContracts = async (
  _k: string,
  networkId: string,
  ...accounts: string[]
) => {
  if (!isValidTzktNetwork(networkId)) {
    console.warn(`${networkId} is not a valid Tzkt network`);
    return [];
  }

  const contractsChunks = await Promise.all(
    accounts.map(async (account) => {
      const { data: userContracts } = await getUserContracts(networkId, {
        account,
      });

      return userContracts;
    })
  );

  return contractsChunks.reduce(
    (contracts, chunk) => [...contracts, ...chunk],
    []
  );
};

function makeQuery<P extends Record<string, unknown>, R>(
  url: (params: P) => string,
  searchParams: (params: P) => Record<string, unknown>
) {
  return (network: TzktNetwork, params: P) => {
    return api.get<R>(url(params), {
      baseURL: baseUrls[network],
      params: searchParams(params),
    });
  };
}
