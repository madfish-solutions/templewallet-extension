import { useMemo } from 'react';

import { useGetEvmActiveBlockExplorer } from 'temple/front/ready';
import { EvmNetworkEssentials } from 'temple/networks';

export const useBlockExplorerUrl = (network: EvmNetworkEssentials): string | undefined => {
  const getBlockExplorer = useGetEvmActiveBlockExplorer();
  const blockExplorer = useMemo(
    () => getBlockExplorer(network.chainId.toString()),
    [getBlockExplorer, network.chainId]
  );

  return blockExplorer?.url;
};
