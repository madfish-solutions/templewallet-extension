import useSWR, { Key, SWRConfiguration } from 'swr';
import { FetcherResponse } from 'swr/_internal';

import { toError } from 'lib/analytics';

type Fetcher<Data = unknown, SWRKey extends Key = Key> = (arg: SWRKey) => FetcherResponse<Data>;

function stringifyKey(key: Key): string {
  try {
    return JSON.stringify(key);
  } catch {
    return String(key);
  }
}

function withSwrContext<Data, SWRKey extends Key = Key>(
  key: SWRKey,
  fetcher: Fetcher<Data, SWRKey>
): Fetcher<Data, SWRKey> {
  return async arg => {
    try {
      return await fetcher(arg);
    } catch (err) {
      const error = toError(err);
      (error as any).__swr = {
        key: stringifyKey(key),
        arg
      };
      throw error;
    }
  };
}

/** Fetcher must not return (awaited) `undefined` value - results in endless fetching. */
export const useTypedSWR = <Data, Error = any, SWRKey extends Key = Key>(
  key: SWRKey,
  fetcher: Fetcher<Data, SWRKey> | null,
  config?: SWRConfiguration<Data, Error, Fetcher<Data, SWRKey>>
) => {
  const wrappedFetcher = fetcher ? withSwrContext(key, fetcher) : null;
  return useSWR(key, wrappedFetcher, config);
};

/** Fetcher must not return (awaited) `undefined` value - results in endless fetching. */
export const useRetryableSWR = <Data, Error = any, SWRKey extends Key = Key>(
  key: SWRKey,
  fetcher: Fetcher<Data, SWRKey> | null,
  config?: SWRConfiguration<Data, Error, Fetcher<Data, SWRKey>>
) => {
  const wrappedFetcher = fetcher ? withSwrContext(key, fetcher) : null;
  return useSWR(key, wrappedFetcher, { errorRetryCount: 2, ...config });
};
