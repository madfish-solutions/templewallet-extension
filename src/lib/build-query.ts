import { AxiosInstance, AxiosRequestConfig } from "axios";

export type RequestParams<T> = T &
  Omit<AxiosRequestConfig, "method" | "url" | "params">;

export function buildQuery<P extends Record<string, unknown>, R = any>(
  api: AxiosInstance,
  method: "GET" | "POST",
  path: ((params: RequestParams<P>) => string) | string,
  toQueryParams?:
    | ((params: RequestParams<P>) => Record<string, unknown>)
    | Array<keyof P>
) {
  return async (params: RequestParams<P>) => {
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
