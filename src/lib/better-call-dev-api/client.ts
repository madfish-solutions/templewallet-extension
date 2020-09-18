import axios, { AxiosError } from "axios";
import {
  TokenTransfersQueryParams,
  ContractsQueryParams,
  TokenVolumeSeriesQueryParams,
  PageableTokenContracts,
  TokenSeries,
  PageableTokenTransfers,
} from "./types";

const api = axios.create({ baseURL: "https://api.better-call.dev/v1" });
api.interceptors.response.use(
  (res) => res,
  (err) => {
    throw new Error(
      `Failed when querying Better Call API: ${
        (err as AxiosError).response?.data.message
      }`
    );
  }
);

export const getContracts = makeQuery<
  ContractsQueryParams,
  PageableTokenContracts
>(
  (params) =>
    `/tokens/${params.network}${
      params.faversion ? `/version/${params.faversion}` : ""
    }`,
  ["last_id", "size"]
);

export const getTokenVolumeSeries = makeQuery<
  TokenVolumeSeriesQueryParams,
  TokenSeries
>((params) => `/tokens/${params.network}/series`, [
  "address",
  "period",
  "token_id",
]);

export const getTokenTransfers = makeQuery<
  TokenTransfersQueryParams,
  PageableTokenTransfers
>((params) => `/tokens/${params.network}/transfers/${params.address}`, [
  "last_id",
  "size",
]);

function makeQuery<P extends {}, R>(
  url: (params: P) => string,
  paramsKeys: Array<keyof P>
) {
  return (params: P) =>
    api.get<R>(url(params), {
      params: Object.fromEntries(
        Object.entries(params).filter(([key]) =>
          paramsKeys.includes(key as any)
        )
      ),
    });
}
