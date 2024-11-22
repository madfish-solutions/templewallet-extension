import memoizee from 'memoizee';

interface ListenerClassConstructor<T> {
  new (chainId: number, httpRpcUrl: string, account: HexString): T;
}

export const makeGetTransferEventsListener = <T>(constructor: ListenerClassConstructor<T>) =>
  memoizee((chainId: number, httpRpcUrl: string, account: HexString) => new constructor(chainId, httpRpcUrl, account), {
    length: 3
  });
