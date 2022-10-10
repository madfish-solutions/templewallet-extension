import useSWR, { Key, Fetcher, SWRConfiguration, SWRResponse } from 'swr';

export const useRetryableSWR = <Data, Error = any, SWRKey extends Key = Key>(
  key: SWRKey,
  fetcher: Fetcher<Data, SWRKey> | null,
  config: SWRConfiguration<Data, Error, Fetcher<Data, SWRKey>> | undefined
): SWRResponse<Data, Error> => {
  try {
    // Chromium request throttle after 4 errors (https://www.chromium.org/throttling)
    return useSWR(key, fetcher, { errorRetryCount: 2, ...config });
  } catch (err: any) {
    throw err;
  }
};
