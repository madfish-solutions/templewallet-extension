import retry from 'async-retry';

export const infiniteRetry = <T>(fn: () => Promise<T>) =>
  retry(fn, { forever: true, minTimeout: 1000, maxTimeout: 60000, onRetry: e => console.error(e) });
