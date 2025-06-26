import memoizee from 'memoizee';

import { EvmNetworkEssentials } from 'temple/networks';

interface ListenerClassConstructor<T> {
  new (network: EvmNetworkEssentials, account: HexString): T;
}

export const makeGetTransferEventsListener = <T>(constructor: ListenerClassConstructor<T>) =>
  memoizee((network: EvmNetworkEssentials, account: HexString) => new constructor(network, account), {
    length: 2
  });
