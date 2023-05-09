export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const LONG_TIMEOUT = 60_000;

export const MEDIUM_TIMEOUT = 30_000;

export const SHORT_TIMEOUT = 15_000;

export const RETRY_OPTIONS = {
  minTimeout: 300,
  maxRetryTime: 15_000
};
