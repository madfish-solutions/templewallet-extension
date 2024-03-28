import { useCallback, useMemo } from 'react';

// import * as ViemChains from 'viem/chains';

import { TID, t } from 'lib/i18n';
import { useRetryableSWR } from 'lib/swr';
import { useTempleClient } from 'lib/temple/front/client';
import { useTezosNetworkStored } from 'lib/temple/front/ready';
import { TempleTezosChainId } from 'lib/temple/types';
import { StoredTezosNetwork } from 'temple/networks';

import { loadTezosChainId } from '../tezos';

export const getNetworkTitle = ({
  rpcUrl,
  rpcBaseURL,
  name,
  nameI18nKey
}: {
  rpcUrl?: string;
  rpcBaseURL?: string;
  name?: string;
  nameI18nKey?: TID;
}) => (nameI18nKey ? t(nameI18nKey) : name || rpcBaseURL || rpcUrl);

/** (!) Relies on suspense - use only in PageLayout descendant components. */
export const useTezosNetwork = () => {
  const { id, rpcBaseURL, name, nameI18nKey, color } = useTezosNetworkStored();
  const chainId = useTezosChainIdLoadingValue(rpcBaseURL, true)!;

  return useMemo(
    () => ({
      id,
      rpcBaseURL,
      rpcUrl: rpcBaseURL,
      chainId,
      isMainnet: chainId === TempleTezosChainId.Mainnet,
      isDcp: chainId === TempleTezosChainId.Dcp || chainId === TempleTezosChainId.DcpTest,
      name,
      nameI18nKey,
      color
    }),
    [id, rpcBaseURL, chainId, name, nameI18nKey, color]
  );
};

// export const useEvmNetwork = () => useMemo(() => ViemChains.optimism, []);

export const useTezosNetworkRpcUrl = () => useTezosNetworkStored().rpcBaseURL;

export function useTezosChainIdLoadingValue(rpcUrl: string, suspense?: boolean): string | undefined {
  const { data: chainId } = useTezosChainIdLoading(rpcUrl, suspense);

  return chainId;
}

export function useTezosChainIdLoading(rpcUrl: string, suspense?: boolean) {
  const fetchChainId = useCallback(() => loadTezosChainId(rpcUrl), [rpcUrl]);

  return useRetryableSWR(['chain-id', rpcUrl], fetchChainId, { suspense, revalidateOnFocus: false });
}

export const useTempleNetworksActions = () => {
  const { customTezosNetworks, updateSettings } = useTempleClient();

  const addTezosNetwork = useCallback(
    (newNetwork: StoredTezosNetwork) =>
      updateSettings({
        customTezosNetworks: [...customTezosNetworks, newNetwork]
      }),
    [customTezosNetworks, updateSettings]
  );

  const removeTezosNetwork = useCallback(
    (networkId: string) =>
      updateSettings({
        customTezosNetworks: customTezosNetworks.filter(n => n.id !== networkId)
      }),
    [customTezosNetworks, updateSettings]
  );

  return { customTezosNetworks, addTezosNetwork, removeTezosNetwork };
};
