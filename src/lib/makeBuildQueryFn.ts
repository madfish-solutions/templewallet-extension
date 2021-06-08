import axios from "axios";

function pick<T, U extends keyof T>(obj: T, keys: U[]) {
  const newObj: Partial<T> = {};
  keys.forEach((key) => {
    if (key in obj) {
      newObj[key] = obj[key];
    }
  });
  return newObj as Pick<T, U>;
}

export default function makeBuildQueryFn<P, R>(baseURL: string) {
  const api = axios.create({ baseURL });
  return function f1<P1 extends P, R1 extends R>(
    method: "GET" | "POST",
    path: string | ((params: P1) => string),
    toQueryParams?: (keyof P1)[] | ((params: P1) => Record<string, any>)
  ) {
    return async (params: P1) => {
      const url = typeof path === "function" ? path(params) : path;
      const queryParams =
        typeof toQueryParams === "function"
          ? toQueryParams(params)
          : toQueryParams
          ? pick(params, toQueryParams)
          : undefined;

      const r = await api.request<R1>({
        method,
        url,
        params: queryParams,
      });
      return r.data;
    };
  };
}
