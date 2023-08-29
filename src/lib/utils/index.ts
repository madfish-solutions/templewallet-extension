export { arrayBufferToString, stringToArrayBuffer, uInt8ArrayToString, stringToUInt8Array } from './buffers';

/** From lodash */
type Truthy<T> = T extends null | undefined | void | false | '' | 0 | 0n ? never : T;

export const isTruthy = <T>(value: T): value is Truthy<T> => Boolean(value);

/** With strict equality check (i.e. `===`) */
export const filterUnique = <T>(array: T[]) => Array.from(new Set(array));

const DEFAULT_DELAY = 300;

export const delay = (ms = DEFAULT_DELAY) => new Promise(res => setTimeout(res, ms));

class AssertionError extends Error {
  constructor(message?: string, public actual?: any) {
    super(message);
  }
}

export const assert: (value: any, errorMessage?: string) => asserts value = (
  value,
  errorMessage = `The value ${value} is not truthy`
) => {
  if (!value) throw new AssertionError(errorMessage, value);
};

export const createQueue = () => {
  let worker: Promise<any> = Promise.resolve();

  return <T>(factory: () => Promise<T>): Promise<T> =>
    new Promise((res, rej) => {
      worker = worker.then(() => factory().then(res).catch(rej));
    });
};

export const openLink = (href: string, newTab = true, noreferrer = false) => {
  const anchor = document.createElement('a');
  anchor.href = href;
  if (newTab) anchor.target = '_blank';
  if (noreferrer) anchor.rel = 'noreferrer';
  anchor.click();
};
