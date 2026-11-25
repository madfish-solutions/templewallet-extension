import retry from 'async-retry';
import { AxiosResponse, isAxiosError } from 'axios';

import { t } from 'lib/i18n';

const UNAVAILABLE_PAIR_MESSAGE = 'Such exchange pair is not available';

export class ExolixPairUnavailableError extends Error {
  // async-retry stops retries for errors with this flag.
  readonly bail = true;

  constructor() {
    super(t('pairNotAvailable'));
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
  request: () => Promise<AxiosResponse<T>>,
  retryOptions: retry.Options
): Promise<T> =>
  retry(async () => {
    const response = await request().catch((error: unknown) => {
      if (isAxiosError<T>(error) && error.response && isUnavailablePairResponse(error.response)) return error.response;
      throw error;
    });

    if (isUnavailablePairResponse(response)) throw new ExolixPairUnavailableError();

    return response.data;
  }, retryOptions);
