import { useCallback, useMemo } from 'react';

import { useRetryableSWR } from 'lib/swr';
import { useNetwork, useAccount, useAccountPkh, useAllAccounts } from 'lib/temple/front/ready';
import { loadChainId } from 'lib/temple/helpers';
import { TempleAccountType, TempleChainId } from 'lib/temple/types';

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
      isMainnet: chainId === TempleChainId.Mainnet,
      isDcp: chainId === TempleChainId.Dcp || chainId === TempleChainId.DcpTest
    }),
    [rpcUrl, chainId]
  );
};

export const useTezosNetworkRpcUrl = () => useNetwork().rpcBaseURL;

/** (!) Relies on suspense - use only in PageLayout descendant components. */
// @ts-expect-error
const useTezosNetworkChainId = () => {
  const rpcURL = useTezosNetworkRpcUrl();

  return useTezosChainIdLoadingValue(rpcURL, true)!;
};

export const useTezosAccount = useAccount;

export const useTezosAccountAddress = useAccountPkh;

export function useTezosRelevantAccounts(chainId: string) {
  const allAccounts = useAllAccounts();

  return useMemo(
    () =>
      allAccounts.filter(acc => {
        switch (acc.type) {
          case TempleAccountType.ManagedKT:
            return acc.chainId === chainId;

          case TempleAccountType.WatchOnly:
            return !acc.chainId || acc.chainId === chainId;

          default:
            return true;
        }
      }),
    [chainId, allAccounts]
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
  const fetchChainId = useCallback(() => loadChainId(rpcUrl), [rpcUrl]);

  return useRetryableSWR(['chain-id', rpcUrl], fetchChainId, { suspense, revalidateOnFocus: false });
}
