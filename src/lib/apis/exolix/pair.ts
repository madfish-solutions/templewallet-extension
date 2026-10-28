import retry from 'async-retry';
import { AxiosResponse, isAxiosError } from 'axios';

import { EXOLIX_CACHE_TTL_MS } from './constants';
import { GetRateRequestData } from './types';

type ExchangePair = Pick<GetRateRequestData, 'coinFrom' | 'networkFrom' | 'coinTo' | 'networkTo'>;

const UNAVAILABLE_PAIR_MESSAGE = 'Such exchange pair is not available';
const unavailablePairs = new Map<string, ExolixPairUnavailableError>();
const availabilityListeners = new Set<VoidFunction>();

export const getExolixPairKey = ({ coinFrom, networkFrom, coinTo, networkTo }: ExchangePair): string =>
  JSON.stringify([coinFrom, networkFrom, coinTo, networkTo]);

export class ExolixPairUnavailableError extends Error {
  // async-retry stops retries for errors with this flag.
  readonly bail = true;
  readonly expiresAt = Date.now() + EXOLIX_CACHE_TTL_MS;

  constructor(public readonly pairKey: string) {
    super('Route not found');
    this.name = 'ExolixPairUnavailableError';
  }
}

export const getExolixPairUnavailableError = (pairKey: string): ExolixPairUnavailableError | undefined => {
  const error = unavailablePairs.get(pairKey);

  return error && error.expiresAt > Date.now() ? error : undefined;
};

export const subscribeToExolixPairAvailability = (listener: VoidFunction): VoidFunction => {
  availabilityListeners.add(listener);

  return () => {
    availabilityListeners.delete(listener);
  };
};

const cacheUnavailablePair = (error: ExolixPairUnavailableError): void => {
  if (unavailablePairs.get(error.pairKey) === error) return;

  unavailablePairs.set(error.pairKey, error);
  setTimeout(
    () => {
      if (unavailablePairs.get(error.pairKey) !== error) return;

      unavailablePairs.delete(error.pairKey);
      availabilityListeners.forEach(listener => listener());
    },
    Math.max(0, error.expiresAt - Date.now())
  );
  availabilityListeners.forEach(listener => listener());
};

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
      const unavailableError = getExolixPairUnavailableError(pairKey);
      if (unavailableError) throw unavailableError;

      const response = await request();
      if (isUnavailablePairResponse(response)) throw new ExolixPairUnavailableError(pairKey);

      return response.data;
    } catch (error) {
      const requestError =
        isAxiosError(error) && error.response && isUnavailablePairResponse(error.response)
          ? new ExolixPairUnavailableError(pairKey)
          : error;

      if (requestError instanceof ExolixPairUnavailableError) {
        cacheUnavailablePair(requestError);
      }

      throw requestError;
    }
  }, retryOptions);
};
