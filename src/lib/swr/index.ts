import useSWR, { Key, Fetcher, SWRConfiguration, SWRResponse } from 'swr';

export const useRetryableSWR = <Data, Error = any, SWRKey extends Key = Key>(
  key: SWRKey,
  fetcher: Fetcher<Data, SWRKey> | null,
  config: SWRConfiguration<Data, Error, Fetcher<Data, SWRKey>> | undefined
): SWRResponse<Data, Error> => useSWR(key, fetcher, { errorRetryCount: 2, ...config });
