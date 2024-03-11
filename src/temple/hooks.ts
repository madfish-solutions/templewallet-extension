import { useMemo } from 'react';

import { useChainId, useNetwork } from 'lib/temple/front/ready';
import { TempleChainId } from 'lib/temple/types';

interface TezosNetwork {
  rpcUrl: string;
  chainId: string;
  isMainnet: boolean;
}

export const useTezosNetwork = (): TezosNetwork => {
  const chainId = useChainId(true)!;
  const { rpcBaseURL: rpcUrl } = useNetwork();

  return useMemo(() => ({ rpcUrl, chainId, isMainnet: chainId === TempleChainId.Mainnet }), [rpcUrl, chainId]);
};
