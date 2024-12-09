import memoizee from 'memoizee';

interface ListenerClassConstructor<T> {
  new (httpRpcUrl: string, account: HexString): T;
}

export const makeGetTransferEventsListener = <T>(constructor: ListenerClassConstructor<T>) =>
  memoizee((httpRpcUrl: string, account: HexString) => new constructor(httpRpcUrl, account), {
    length: 2
  });
