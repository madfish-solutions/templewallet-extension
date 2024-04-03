import { useMemo, useState } from 'react';

import { useAllTezosNetworks } from 'temple/front';
import { StoredNetwork } from 'temple/networks';

export interface NetworkSelectController {
  network: StoredNetwork;
  setNetwork: SyncFn<StoredNetwork>;
}

export const useNetworkSelectController = (): NetworkSelectController => {
  const allTezosNetworks = useAllTezosNetworks();

  const [network, setNetwork] = useState<StoredNetwork>(() => allTezosNetworks[0]);

  return useMemo(() => ({ network, setNetwork }), [network]);
};
