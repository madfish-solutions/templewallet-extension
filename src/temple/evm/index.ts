import memoizee from 'memoizee';
import { createPublicClient, http } from 'viem';
import * as ViemChains from 'viem/chains';

import { rejectOnTimeout } from 'lib/utils';
import { MAX_MEMOIZED_TOOLKITS } from 'temple/misc';

export const getReadOnlyEvm = memoizee(
  (rpcUrl: string) =>
    createPublicClient({
      transport: http(rpcUrl)
    }),
  { max: MAX_MEMOIZED_TOOLKITS }
);

export const getViemChainsList = memoizee(() => Object.values(ViemChains));

export const getViemMainnetChainsIds = memoizee(
  () =>
    new Set(
      getViemChainsList()
        .filter(({ testnet }) => testnet !== true)
        .map(({ id }) => id)
    )
);

export function loadEvmChainId(rpcUrl: string, timeout?: number) {
  const rpc = getReadOnlyEvm(rpcUrl);

  if (timeout && timeout > 0)
    return rejectOnTimeout(rpc.getChainId(), timeout, new Error('Timed-out for loadEvmChainId()'));

  return rpc.getChainId();
}
