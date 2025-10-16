import { useCallback } from 'react';

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

  const removeTezosNetworks = useCallback(
    (networkIds: string[]) =>
      updateSettings({
        customTezosNetworks: customTezosNetworks.filter(n => !networkIds.includes(n.id))
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

  const updateEvmNetwork = useCallback(
    (networkId: string, newNetwork: StoredEvmNetwork) =>
      updateSettings({
        customEvmNetworks: customEvmNetworks.map(n => (n.id === networkId ? newNetwork : n))
      }),
    [customEvmNetworks, updateSettings]
  );

  const removeEvmNetworks = useCallback(
    (networkIds: string[]) =>
      updateSettings({
        customEvmNetworks: customEvmNetworks.filter(n => !networkIds.includes(n.id))
      }),
    [customEvmNetworks, updateSettings]
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
