import { useMemo } from 'react';

import { useChainId, useNetwork, useAccount, useAccountPkh } from 'lib/temple/front/ready';
import { TempleAccountType, TempleChainId } from 'lib/temple/types';

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

// @ts-expect-error
// ts-prune-ignore-next
interface TezosAccount {
  address: string;
  title: string;
  isWatchOnly: boolean;
}

export const useTezosAccount = () => {
  const { publicKeyHash: address, type } = useAccount();

  return useMemo(
    () => ({
      address,
      isWatchOnly: type === TempleAccountType.WatchOnly
    }),
    [address, type]
  );
};

export const useTezosAccountAddress = () => useAccountPkh();
