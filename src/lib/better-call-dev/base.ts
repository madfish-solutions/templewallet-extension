import axios, { AxiosRequestConfig } from "axios";

export const BASE_URL = "https://better-call.dev/v1";

export const api = axios.create({ baseURL: BASE_URL });

export type BcdRequestParams<T> = T &
  Omit<AxiosRequestConfig, "method" | "url" | "params">;

export function buildQuery<P extends Record<string, unknown>, R = any>(
  method: "GET" | "POST",
  path: ((params: BcdRequestParams<P>) => string) | string,
  toQueryParams?:
    | ((params: BcdRequestParams<P>) => Record<string, unknown>)
    | Array<keyof P>
) {
  return async (params: BcdRequestParams<P>) => {
    const url = typeof path === "function" ? path(params) : path;
    const queryParams =
      typeof toQueryParams === "function"
        ? toQueryParams(params)
        : toQueryParams
        ? pick(params, toQueryParams)
        : undefined;

    const r = await api.request<R>({
      method,
      url,
      params: queryParams,
      ...params,
    });
    return r.data;
  };
}

function pick<T, U extends keyof T>(obj: T, keys: U[]) {
  const newObj: Partial<T> = {};
  keys.forEach((key) => {
    if (key in obj) {
      newObj[key] = obj[key];
    }
  });
  return newObj as Pick<T, U>;
}

/**
 * Types
 */

export type BcdNetwork = "mainnet" | "edo2net" | "florencenet" | "delphinet";
