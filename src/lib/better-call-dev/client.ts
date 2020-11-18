import axios, { AxiosError } from "axios";
import {
  BcdTokenTransfersQueryParams,
  BcdContractsQueryParams,
  BcdPageableTokenContracts,
  BcdPageableTokenTransfers,
  BcdNetwork,
} from "lib/better-call-dev/types";
import { ThanosChainId } from "lib/thanos/types";

const api = axios.create({ baseURL: "https://api.better-call.dev/v1" });
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const { message } = (err as AxiosError).response?.data;
    throw new Error(`Failed when querying Better Call API: ${message}`);
  }
);

export const BCD_NETWORKS_NAMES = new Map<ThanosChainId, BcdNetwork>([
  [ThanosChainId.Mainnet, "mainnet"],
  [ThanosChainId.Carthagenet, "carthagenet"],
  [ThanosChainId.Delphinet, "delphinet"],
]);

export const getContracts = makeQuery<
  BcdContractsQueryParams,
  BcdPageableTokenContracts
>(
  (params) =>
    `/tokens/${params.network}${
      params.faversion ? `/version/${params.faversion}` : ""
    }`,
  ["last_id", "size"]
);

export const getTokenTransfers = makeQuery<
  BcdTokenTransfersQueryParams,
  BcdPageableTokenTransfers
>((params) => `/tokens/${params.network}/transfers/${params.address}`, [
  "last_id",
  "size",
]);

function makeQuery<P extends Record<string, unknown>, R>(
  url: (params: P) => string,
  searchParamsKeys: Array<keyof P>
) {
  return (params: P) => {
    const searchParams = Object.fromEntries(
      Object.entries(params).filter(([key]) => searchParamsKeys.includes(key))
    );

    return api.get<R>(url(params), { params: searchParams });
  };
}
