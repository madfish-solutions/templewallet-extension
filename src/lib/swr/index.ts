import useSWR, { Key, SWRConfiguration } from 'swr';
import { FetcherResponse } from 'swr/_internal';

type Fetcher<Data = unknown, SWRKey extends Key = Key> = (arg: SWRKey) => FetcherResponse<Data>;

/** Fetcher must not return (awaited) `undefined` value - results in endless fetching. */
export const useTypedSWR = <Data, Error = any, SWRKey extends Key = Key>(
  key: SWRKey,
  fetcher: Fetcher<Data, SWRKey> | null,
  config?: SWRConfiguration<Data, Error, Fetcher<Data, SWRKey>>
) => useSWR(key, fetcher, config);

/** Fetcher must not return (awaited) `undefined` value - results in endless fetching. */
export const useRetryableSWR = <Data, Error = any, SWRKey extends Key = Key>(
  key: SWRKey,
  fetcher: Fetcher<Data, SWRKey> | null,
  config?: SWRConfiguration<Data, Error, Fetcher<Data, SWRKey>>
) => useSWR(key, fetcher, { errorRetryCount: 2, ...config });
