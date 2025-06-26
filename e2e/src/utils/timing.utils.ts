export const VERY_LONG_TIMEOUT = 120_000;

export const LONG_TIMEOUT = 60_000;

export const MEDIUM_TIMEOUT = 30_000;

export const SHORT_TIMEOUT = 15_000;

export const VERY_SHORT_TIMEOUT = 5_000;

export const ONE_SECOND = 1000;

export const RETRY_OPTIONS = {
  minTimeout: 300,
  maxRetryTime: VERY_SHORT_TIMEOUT
};

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
