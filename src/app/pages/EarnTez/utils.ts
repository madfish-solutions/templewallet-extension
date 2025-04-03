import { useMemo } from 'react';

import { Baker } from 'lib/temple/front';
import { useGetTezosActiveBlockExplorer } from 'temple/front/ready';
import { TezosNetworkEssentials } from 'temple/networks';

export const getBakerAddress = (bakerOrAddress: string | Baker) =>
  typeof bakerOrAddress === 'string' ? bakerOrAddress : bakerOrAddress.address;

export const useBlockExplorerUrl = (network: TezosNetworkEssentials): string | undefined => {
  const getBlockExplorer = useGetTezosActiveBlockExplorer();
  const blockExplorer = useMemo(() => getBlockExplorer(network.chainId), [getBlockExplorer, network.chainId]);

  return blockExplorer?.url;
};
