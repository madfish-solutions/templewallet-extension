import { useMemo } from 'react';

import { TEZOS_METADATA, FILM_METADATA } from 'lib/metadata/defaults';
import { useTezosChainIdLoadingValue, useTezosNetwork } from 'temple/front';
import { isTezosDcpChainId } from 'temple/networks';

export { useAllAvailableTokens, useEnabledAccountTokensSlugs } from './tokens';
export { useAccountCollectibles, useEnabledAccountCollectiblesSlugs } from './collectibles';

export const useGasToken = (networkRpc?: string) => {
  const { rpcBaseURL, isDcp: isDefaultDcp } = useTezosNetwork();
  const suspense = Boolean(networkRpc) && networkRpc !== rpcBaseURL;
  const chainId = useTezosChainIdLoadingValue(networkRpc ?? rpcBaseURL, suspense);

  const isDcpNetwork = useMemo(
    () => (suspense ? isTezosDcpChainId(chainId!) : isDefaultDcp),
    [chainId, suspense, isDefaultDcp]
  );

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
