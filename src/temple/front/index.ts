import { useMemo } from 'react';

import { useCurrentAccountId, useAccount, useAllAccounts, useTezos } from 'lib/temple/front/ready';
import { TempleAccountType } from 'lib/temple/types';
import { TempleChainName } from 'temple/types';

import { AccountForChain, getAccountAddressForChain, getAccountForChain } from '../accounts';

export { useTezos };
export {
  useTezosNetwork,
  useEvmNetwork,
  useTezosNetworkRpcUrl,
  useTezosChainIdLoading,
  useTezosChainIdLoadingValue
} from './networks';
export { useOnTezosBlock } from './use-block';

export { useCurrentAccountId, useAccount };

export const useAccountForTezos = () => useAccountForChain(TempleChainName.Tezos);

export const useAccountForEvm = () => useAccountForChain(TempleChainName.EVM);

function useAccountForChain<C extends TempleChainName>(chain: C): AccountForChain<C> | null {
  const account = useAccount();

  return useMemo(() => getAccountForChain(account, chain), [account, chain]);
}

export const useAccountAddressForTezos = () => useAccountAddressForChain(TempleChainName.Tezos);
export const useAccountAddressForEvm = () => useAccountAddressForChain(TempleChainName.EVM) as HexString | undefined;

function useAccountAddressForChain(chain: TempleChainName): string | undefined {
  const account = useAccount();

  return useMemo(() => getAccountAddressForChain(account, chain), [account, chain]);
}

/** TODO: Check usage again */
export function useRelevantAccounts(tezosChainId: string) {
  const allAccounts = useAllAccounts();

  return useMemo(
    () =>
      allAccounts.filter(acc => {
        switch (acc.type) {
          case TempleAccountType.ManagedKT:
            return (
              Boolean(acc.tezosAddress) && // To know if logic (interface) remained
              acc.chainId === tezosChainId
            );

          case TempleAccountType.WatchOnly:
            return acc.chain === 'tezos' ? !acc.chainId || acc.chainId === tezosChainId : true;

          default:
            return true;
        }
      }),
    [tezosChainId, allAccounts]
  );
}
