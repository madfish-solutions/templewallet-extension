import { HttpBackend } from "@taquito/http-utils";
import { ThanosChainId } from "lib/thanos/types";
import {
  BcdRequestParams,
  BcdAccountQueryParams,
  BcdAccountInfo,
  BcdTokenTransfersQueryParams,
  BcdContractsQueryParams,
  BcdPageableTokenContracts,
  BcdPageableTokenTransfers,
  BcdOperationsSearchQueryParams,
  BcdOperationsSearchResponse,
  BcdNetwork,
} from "lib/better-call-dev";

export const BCD_NETWORKS_NAMES = new Map<ThanosChainId, BcdNetwork>([
  [ThanosChainId.Mainnet, "mainnet"],
  [ThanosChainId.Carthagenet, "carthagenet"],
  [ThanosChainId.Delphinet, "delphinet"],
]);

export const getAccount = makeQuery<BcdAccountQueryParams, BcdAccountInfo>(
  "GET",
  (params) => `/account/${params.network}/${params.address}`
);

export const SEARCH_PAGE_SIZE = 10;

export const getContracts = makeQuery<
  BcdContractsQueryParams,
  BcdPageableTokenContracts
>(
  "GET",
  (params) =>
    `/tokens/${params.network}${
      params.faversion ? `/version/${params.faversion}` : ""
    }`,
  ["last_id", "size"]
);

export const getTokenTransfers = makeQuery<
  BcdTokenTransfersQueryParams,
  BcdPageableTokenTransfers
>("GET", (params) => `/tokens/${params.network}/transfers/${params.address}`, [
  "last_id",
  "size",
]);

export const searchOperations = makeQuery<
  BcdOperationsSearchQueryParams,
  BcdOperationsSearchResponse
>("GET", "/search", ({ network, address, offset, since = 0 }) => ({
  q: address,
  i: "operation",
  n: network,
  g: 1,
  s: since,
  o: offset,
}));

/**
 * Base
 */

export const BASE_URL = "https://api.better-call.dev/v1";

const backend = new HttpBackend();

export function makeQuery<P extends Record<string, unknown>, R = any>(
  method: "GET" | "POST",
  path: ((params: BcdRequestParams<P>) => string) | string,
  toQueryParams?:
    | ((params: BcdRequestParams<P>) => Record<string, unknown>)
    | Array<keyof P>
) {
  return (params: BcdRequestParams<P>) => {
    const pathStr = typeof path === "function" ? path(params) : path;
    const url = `${BASE_URL}${pathStr}`;
    const query =
      typeof toQueryParams === "function"
        ? toQueryParams(params)
        : toQueryParams
        ? Object.fromEntries(
            Object.entries(params).filter(([key]) =>
              toQueryParams.includes(key)
            )
          )
        : undefined;
    const { headers, timeout } = params;

    return backend.createRequest<R>({ method, url, query, headers, timeout });
  };
}
