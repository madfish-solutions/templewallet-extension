import { AxiosResponse, isAxiosError } from 'axios';

import { delay } from 'lib/utils';

export const withAxiosDataExtract =
  <A extends unknown[], T>(fn: (...args: A) => Promise<AxiosResponse<T>>) =>
  async (...args: A) => {
    const response = await fn(...args);

    return response.data;
  };

export async function refetchOnce429<R>(fetcher: () => Promise<R>, delayAroundInMS = 1000) {
  try {
    return await fetcher();
  } catch (err) {
    if (isAxiosError(err)) {
      if (err.response?.status === 429) {
        await delay(delayAroundInMS);
        const res = await fetcher();
        await delay(delayAroundInMS);
        return res;
      }
    }

    throw err;
  }
}
