import { useCallback } from 'react';

import { t } from 'lib/i18n';
import { useRetryableSWR } from 'lib/swr';
import { useTempleClient } from 'lib/temple/front/client';
import { NetworkBase, StoredEvmNetwork, StoredTezosNetwork } from 'temple/networks';

import { loadTezosChainId } from '../tezos';

export const getNetworkTitle = ({
  rpcBaseURL,
  name,
  nameI18nKey
}: Pick<NetworkBase, 'name' | 'nameI18nKey' | 'rpcBaseURL'>) => (nameI18nKey ? t(nameI18nKey) : name || rpcBaseURL);

export function useTezosChainIdLoadingValue(rpcUrl: string, suspense?: boolean): string | undefined {
  const { data: chainId } = useTezosChainIdLoading(rpcUrl, suspense);

  return chainId;
}

function useTezosChainIdLoading(rpcUrl: string, suspense?: boolean) {
  const fetchChainId = useCallback(() => loadTezosChainId(rpcUrl), [rpcUrl]);

  return useRetryableSWR(['chain-id', rpcUrl], fetchChainId, { suspense, revalidateOnFocus: false });
}

export const useTempleNetworksActions = () => {
  const { customTezosNetworks, customEvmNetworks, updateSettings } = useTempleClient();

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

  const addEvmNetwork = useCallback(
    (newNetwork: StoredEvmNetwork) =>
      updateSettings({
        customEvmNetworks: [...customEvmNetworks, newNetwork]
      }),
    [customEvmNetworks, updateSettings]
  );

  const removeEvmNetwork = useCallback(
    (networkId: string) =>
      updateSettings({
        customEvmNetworks: customEvmNetworks.filter(n => n.id !== networkId)
      }),
    [customEvmNetworks, updateSettings]
  );

  return {
    customTezosNetworks,
    customEvmNetworks,
    addTezosNetwork,
    removeTezosNetwork,
    addEvmNetwork,
    removeEvmNetwork
  };
};
