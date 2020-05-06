import useSWR, { keyInterface, ConfigInterface, cache } from "swr";

export function useRetryableSWR<T, E = any>(
  key: keyInterface,
  fn?: (...args: any[]) => Promise<T>,
  config: ConfigInterface<T, E> = {}
) {
  try {
    return useSWR(key, fn, { errorRetryCount: 10, ...config });
  } catch (err) {
    if (err instanceof Promise) throw err;
    const [, , errorKey] = cache.serializeKey(key);
    err.swrErrorKey = errorKey;
    throw err;
  }
}
