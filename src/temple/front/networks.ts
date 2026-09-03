import { useCallback } from 'react';

import { dispatch } from 'app/store';
import { setAssetsFilterChain } from 'app/store/assets-filter-options/actions';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front/client';
import { NetworkBase, StoredEvmNetwork, StoredTezosNetwork } from 'temple/networks';

export const getNetworkTitle = ({
  rpcBaseURL,
  name,
  nameI18nKey
}: Pick<NetworkBase, 'name' | 'nameI18nKey' | 'rpcBaseURL'>) => (nameI18nKey ? t(nameI18nKey) : name || rpcBaseURL);

export const useTempleNetworksActions = () => {
  const { customTezosNetworks, customEvmNetworks, updateSettings } = useTempleClient();
  const { filterChain } = useAssetsFilterOptionsSelector();

  const addTezosNetwork = useCallback(
    (newNetwork: StoredTezosNetwork) =>
      updateSettings({
        customTezosNetworks: [...customTezosNetworks, newNetwork]
      }),
    [customTezosNetworks, updateSettings]
  );

  const updateTezosNetwork = useCallback(
    (networkId: string, newNetwork: StoredTezosNetwork) =>
      updateSettings({
        customTezosNetworks: customTezosNetworks.map(n => (n.id === networkId ? newNetwork : n))
      }),
    [customTezosNetworks, updateSettings]
  );

  const removeSomeNetworks = useCallback(
    <T extends NetworkBase>(
      networkIds: string[],
      customNetworks: T[],
      setCustomNetworks: (networks: T[]) => Promise<void>
    ) => {
      const filterNetwork = customNetworks.find(({ chainId }) => chainId === filterChain?.chainId);
      if (filterNetwork && networkIds.includes(filterNetwork.id)) {
        dispatch(setAssetsFilterChain(null));
      }

      return setCustomNetworks(customNetworks.filter(n => !networkIds.includes(n.id)));
    },
    [filterChain]
  );

  const removeTezosNetworks = useCallback(
    (networkIds: string[]) =>
      removeSomeNetworks(networkIds, customTezosNetworks, networks =>
        updateSettings({ customTezosNetworks: networks })
      ),
    [customTezosNetworks, updateSettings, removeSomeNetworks]
  );

  const addEvmNetwork = useCallback(
    (newNetwork: StoredEvmNetwork) =>
      updateSettings({
        customEvmNetworks: [...customEvmNetworks, newNetwork]
      }),
    [customEvmNetworks, updateSettings]
  );

  const updateEvmNetwork = useCallback(
    (networkId: string, newNetwork: StoredEvmNetwork) =>
      updateSettings({
        customEvmNetworks: customEvmNetworks.map(n => (n.id === networkId ? newNetwork : n))
      }),
    [customEvmNetworks, updateSettings]
  );

  const removeEvmNetworks = useCallback(
    (networkIds: string[]) =>
      removeSomeNetworks(networkIds, customEvmNetworks, networks => updateSettings({ customEvmNetworks: networks })),
    [customEvmNetworks, updateSettings, removeSomeNetworks]
  );

  return {
    customTezosNetworks,
    customEvmNetworks,
    addTezosNetwork,
    updateTezosNetwork,
    removeTezosNetworks,
    addEvmNetwork,
    updateEvmNetwork,
    removeEvmNetworks
  };
};
