import useSWR, { Key, SWRConfiguration, SWRResponse } from 'swr';
import { FetcherResponse } from 'swr/_internal';

type Fetcher<Data = unknown, SWRKey extends Key = Key> = (arg: SWRKey) => FetcherResponse<Data>;

export const useTypedSWR = <Data, Error = any, SWRKey extends Key = Key>(
  key: SWRKey,
  fetcher: Fetcher<Data, SWRKey> | null,
  config?: SWRConfiguration<Data, Error, Fetcher<Data, SWRKey>>
): SWRResponse<Data, Error> => useSWR(key, fetcher, config);

export const useRetryableSWR = <Data, Error = any, SWRKey extends Key = Key>(
  key: SWRKey,
  fetcher: Fetcher<Data, SWRKey> | null,
  config?: SWRConfiguration<Data, Error, Fetcher<Data, SWRKey>>
): SWRResponse<Data, Error> => useSWR(key, fetcher, { errorRetryCount: 2, ...config });
