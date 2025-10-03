import memoizee from 'memoizee';

import { FastRpcClient } from 'lib/taquito-fast-rpc';
import { MAX_MEMOIZED_TOOLKITS } from 'temple/misc';
import { TezosNetworkEssentials } from 'temple/networks';

export const makeTezosClientId = (network: TezosNetworkEssentials, accountPkh: string, straightaway = false) =>
  `${accountPkh}@${JSON.stringify(network)}@${straightaway}`;

export const getTezosFastRpcClient = memoizee((rpcUrl: string) => new FastRpcClient(rpcUrl), {
  max: MAX_MEMOIZED_TOOLKITS
});
