import { useMemo } from 'react';

import { useChainId, useNetwork } from 'lib/temple/front/ready';
import { TempleChainId } from 'lib/temple/types';

// @ts-expect-error
// ts-prune-ignore-next
interface TezosNetwork {
  rpcUrl: string;
  chainId: string;
  isMainnet: boolean;
}

export const useTezosNetwork = () => {
  const chainId = useChainId(true)!;
  const { rpcBaseURL: rpcUrl } = useNetwork();

  return useMemo(
    () => ({
      rpcUrl,
      chainId,
      isMainnet: chainId === TempleChainId.Mainnet,
      isDcp: chainId === TempleChainId.Dcp || chainId === TempleChainId.DcpTest
    }),
    [rpcUrl, chainId]
  );
};
