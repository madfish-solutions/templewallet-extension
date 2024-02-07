import { useMemo } from 'react';

import { TEZOS_METADATA, FILM_METADATA } from 'lib/metadata/defaults';
import { useChainIdLoading, useNetwork } from 'lib/temple/front';

export { useAllAvailableTokens, useEnabledAccountTokensSlugs } from './tokens';
export { useAccountCollectibles, useEnabledAccountCollectiblesSlugs } from './collectibles';

const KNOWN_DCP_CHAIN_IDS = ['NetXooyhiru73tk', 'NetXX7Tz1sK8JTa'];

export const useGasToken = (networkRpc?: string) => {
  const { type: defaultNetworkType, rpcBaseURL } = useNetwork();
  const isSameRpcURL = networkRpc === rpcBaseURL;
  const { data: chainId } = useChainIdLoading(networkRpc ?? rpcBaseURL, Boolean(networkRpc) && !isSameRpcURL);
  const isDcpNetwork =
    networkRpc && !isSameRpcURL ? KNOWN_DCP_CHAIN_IDS.includes(chainId!) : defaultNetworkType === 'dcp';

  return useMemo(
    () =>
      isDcpNetwork
        ? {
            logo: 'misc/token-logos/film.png',
            symbol: 'ф',
            assetName: 'FILM',
            metadata: FILM_METADATA,
            isDcpNetwork: true
          }
        : {
            logo: 'misc/token-logos/tez.svg',
            symbol: 'ꜩ',
            assetName: 'tez',
            metadata: TEZOS_METADATA
          },
    [isDcpNetwork]
  );
};
