import { useMemo } from 'react';

import { useEnabledEvmChains, useEnabledTezosChains } from 'temple/front';

export const ALL_NETWORKS = 'All Networks';

export const useSortedNetworks = () => {
  const tezosChains = useEnabledTezosChains();
  const evmChains = useEnabledEvmChains();

  return useMemo(() => [ALL_NETWORKS, ...tezosChains, ...evmChains], [evmChains, tezosChains]);
};
