import { useCallback, useMemo } from 'react';

import { useRetryableSWR } from 'lib/swr';
import { useNetwork } from 'lib/temple/front/ready';
import { TempleTezosChainId } from 'lib/temple/types';

import { loadTezosChainId } from '../tezos';

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

export const useTezosNetworkRpcUrl = () => useNetwork().rpcBaseURL;

export function useTezosChainIdLoadingValue(rpcUrl: string, suspense?: boolean): string | undefined {
  const { data: chainId } = useTezosChainIdLoading(rpcUrl, suspense);

  return chainId;
}

export function useTezosChainIdLoading(rpcUrl: string, suspense?: boolean) {
  const fetchChainId = useCallback(() => loadTezosChainId(rpcUrl), [rpcUrl]);

  return useRetryableSWR(['chain-id', rpcUrl], fetchChainId, { suspense, revalidateOnFocus: false });
}
