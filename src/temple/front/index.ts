import { useCallback, useMemo } from 'react';

import * as ViemChains from 'viem/chains';

import { useRetryableSWR } from 'lib/swr';
import { useNetwork, useCurrentAccountId, useAccount, useAllAccounts, useTezos } from 'lib/temple/front/ready';
import { TempleAccountType, TempleTezosChainId } from 'lib/temple/types';
import { TempleChainName } from 'temple/types';

import { AccountForChain, getAccountAddressForChain, getAccountForChain } from '../accounts';
import { loadTezosChainId } from '../tezos';

export { useTezos };
export { useOnTezosBlock } from './use-block';

/** (!) Relies on suspense - use only in PageLayout descendant components. */
export const useTezosNetwork = () => {
  const { rpcBaseURL: rpcUrl } = useNetwork();
  const chainId = useTezosChainIdLoadingValue(rpcUrl, true)!;

  return useMemo(
    () => ({
      rpcUrl,
      chainId: chainId,
      isMainnet: chainId === TempleTezosChainId.Mainnet,
      isDcp: chainId === TempleTezosChainId.Dcp || chainId === TempleTezosChainId.DcpTest
    }),
    [rpcUrl, chainId]
  );
};

export const useEvmNetwork = () => useMemo(() => ViemChains.optimism, []);

export const useTezosNetworkRpcUrl = () => useNetwork().rpcBaseURL;

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

export function useTezosChainIdLoadingValue(rpcUrl: string, suspense?: boolean): string | undefined {
  const { data: chainId } = useTezosChainIdLoading(rpcUrl, suspense);

  return chainId;
}

export function useTezosChainIdLoading(rpcUrl: string, suspense?: boolean) {
  const fetchChainId = useCallback(() => loadTezosChainId(rpcUrl), [rpcUrl]);

  return useRetryableSWR(['chain-id', rpcUrl], fetchChainId, { suspense, revalidateOnFocus: false });
}
