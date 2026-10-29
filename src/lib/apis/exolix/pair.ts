import retry from 'async-retry';
import { AxiosResponse, isAxiosError } from 'axios';

import { GetRateRequestData } from './types';

type ExchangePair = Pick<GetRateRequestData, 'coinFrom' | 'networkFrom' | 'coinTo' | 'networkTo'>;

const UNAVAILABLE_PAIR_MESSAGE = 'Such exchange pair is not available';

export const getExolixPairKey = ({ coinFrom, networkFrom, coinTo, networkTo }: ExchangePair): string =>
  JSON.stringify([coinFrom, networkFrom, coinTo, networkTo]);

export class ExolixPairUnavailableError extends Error {
  // async-retry stops retries for errors with this flag.
  readonly bail = true;

  constructor(public readonly pairKey: string) {
    super('Route not found');
    this.name = 'ExolixPairUnavailableError';
  }
}

const isUnavailablePairResponse = ({ status, data }: AxiosResponse<unknown>): boolean =>
  status === 422 &&
  typeof data === 'object' &&
  data !== null &&
  (('error' in data && data.error === UNAVAILABLE_PAIR_MESSAGE) ||
    ('message' in data && data.message === UNAVAILABLE_PAIR_MESSAGE));

export const requestExolixPair = <T>(
  pair: ExchangePair,
  request: () => Promise<AxiosResponse<T>>,
  retryOptions: retry.Options
): Promise<T> => {
  const pairKey = getExolixPairKey(pair);

  return retry(async () => {
    try {
      const response = await request();
      if (isUnavailablePairResponse(response)) throw new ExolixPairUnavailableError(pairKey);

      return response.data;
    } catch (error) {
      const requestError =
        isAxiosError(error) && error.response && isUnavailablePairResponse(error.response)
          ? new ExolixPairUnavailableError(pairKey)
          : error;

      throw requestError;
    }
  }, retryOptions);
};
