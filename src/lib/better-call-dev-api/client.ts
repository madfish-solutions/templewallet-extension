import axios, { AxiosError } from "axios";
import {
  BcdTokenTransfersQueryParams,
  BcdContractsQueryParams,
  BcdRawPageableTokenContracts,
  BcdRawPageableTokenTransfers,
  BcdPageableTokenContracts,
  BcdPageableTokenTransfers,
} from "lib/better-call-dev-api/types";

const api = axios.create({ baseURL: "https://api.better-call.dev/v1" });
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const { message } = (err as AxiosError).response?.data;
    throw new Error(`Failed when querying Better Call API: ${message}`);
  }
);

const identityFn = (x: any) => x;

export const getContracts = makeQuery<
  BcdContractsQueryParams,
  BcdRawPageableTokenContracts,
  BcdPageableTokenContracts
>(
  (params) =>
    `/tokens/${params.network}${
      params.faversion ? `/version/${params.faversion}` : ""
    }`,
  ["last_id", "size"],
  ({ tokens, last_id, total }) => ({
    last_id,
    total,
    tokens: tokens.map(({ last_action, timestamp, ...restTokenProps }) => ({
      ...restTokenProps,
      last_action: new Date(last_action),
      timestamp: new Date(timestamp),
    })),
  })
);

export const getTokenTransfers = makeQuery<
  BcdTokenTransfersQueryParams,
  BcdRawPageableTokenTransfers,
  BcdPageableTokenTransfers
>(
  (params) => `/tokens/${params.network}/transfers/${params.address}`,
  ["last_id", "size"],
  ({ transfers, last_id }) => ({
    last_id,
    transfers: transfers.map(({ timestamp, ...restProps }) => ({
      ...restProps,
      timestamp: new Date(timestamp),
    })),
  })
);

function makeQuery<P extends Record<string, unknown>, R, T = R>(
  url: (params: P) => string,
  searchParamsKeys: Array<keyof P>,
  transformer: (rawData: R) => T = identityFn
) {
  return (params: P) => {
    const searchParams = Object.fromEntries(
      Object.entries(params).filter(([key]) => searchParamsKeys.includes(key))
    );

    return api
      .get<R>(url(params), { params: searchParams })
      .then((response) => transformer(response.data));
  };
}
