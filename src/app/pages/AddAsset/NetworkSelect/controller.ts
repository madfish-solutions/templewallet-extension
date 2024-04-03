import { useMemo, useState } from 'react';

import { useAllTezosNetworks } from 'temple/front';
import { NetworkBase } from 'temple/networks';

export interface NetworkSelectController {
  network: NetworkBase;
  setNetwork: SyncFn<NetworkBase>;
}

export const useNetworkSelectController = () => {
  const allTezosNetworks = useAllTezosNetworks();

  const [network, setNetwork] = useState<NetworkBase>(() => allTezosNetworks[0]);

  return useMemo(() => ({ network, setNetwork }), [network]);
};
