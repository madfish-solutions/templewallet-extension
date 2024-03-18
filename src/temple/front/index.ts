import { useCallback, useMemo } from 'react';

import { useRetryableSWR } from 'lib/swr';
import { useNetwork, useStoredAccount, useAllAccounts, useTezos } from 'lib/temple/front/ready';
import { TempleAccountType, TempleTezosChainId } from 'lib/temple/types';
import { TempleChainName } from 'temple/types';

import { loadTezosChainId } from '../tezos';

export { useTezos };
export { useOnTezosBlock } from './use-block';

// @ts-expect-error
// ts-prune-ignore-next
interface TezosNetwork {
  rpcUrl: string;
  chainId: string;
  isMainnet: boolean;
}

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

// ts-prune-ignore-next
export const useEvmNetwork = () => {
  return useMemo(
    () => ({
      //
    }),
    []
  );
};

export const useTezosNetworkRpcUrl = () => useNetwork().rpcBaseURL;

/** (!) Relies on suspense - use only in PageLayout descendant components. */
// @ts-expect-error
const useTezosNetworkChainId = () => {
  const rpcURL = useTezosNetworkRpcUrl();

  return useTezosChainIdLoadingValue(rpcURL, true)!;
};

/** @deprecated // useTezosAccount | useEvmAccount */
export const useAccount = useStoredAccount;

export const useTezosAccountAddress = () => useAccountAddress(TempleChainName.Tezos);
export const useEvmAccountAddress = () => useAccountAddress(TempleChainName.EVM);

function useAccountAddress(chain: TempleChainName): string | undefined {
  const account = useStoredAccount();

  if (account.type === TempleAccountType.WatchOnly) {
    if (account.chain !== chain) return undefined;
    // TODO: if (account.chainId && chainId !== account.chainId) return undefined; ?

    return account.publicKeyHash;
  }

  return chain === 'evm' ? account.evmAddress : account.publicKeyHash;
}

// ts-prune-ignore-next
export const useEthersAccountAddress = () => useAccount().evmAddress;

export function useTezosRelevantAccounts(tezosChainId: string) {
  const allAccounts = useAllAccounts();

  return useMemo(
    () =>
      allAccounts.filter(acc => {
        switch (acc.type) {
          case TempleAccountType.ManagedKT:
            return acc.chainId === tezosChainId;

          case TempleAccountType.WatchOnly:
            return !acc.chainId || acc.chainId === tezosChainId;

          default:
            return true;
        }
      }),
    [tezosChainId, allAccounts]
  );
}

// export function useTezosChainIdLoadingValue(rpcUrl: string): string | undefined;
// export function useTezosChainIdLoadingValue(rpcUrl: string, suspense: boolean): string | undefined;
// export function useTezosChainIdLoadingValue(rpcUrl: string, suspense: false): string | undefined;
// export function useTezosChainIdLoadingValue(rpcUrl: string, suspense: true): string;
export function useTezosChainIdLoadingValue(rpcUrl: string, suspense?: boolean): string | undefined {
  const { data: chainId } = useTezosChainIdLoading(rpcUrl, suspense);

  return chainId;
}

export function useTezosChainIdLoading(rpcUrl: string, suspense?: boolean) {
  const fetchChainId = useCallback(() => loadTezosChainId(rpcUrl), [rpcUrl]);

  return useRetryableSWR(['chain-id', rpcUrl], fetchChainId, { suspense, revalidateOnFocus: false });
}
