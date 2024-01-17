import { useMemo } from 'react';

import { TEZOS_METADATA, FILM_METADATA } from 'lib/metadata/defaults';
import { useNetwork } from 'lib/temple/front';

export { useAllAvailableTokens, useEnabledAccountTokensSlugs } from './tokens';
export { useAccountCollectibles, useEnabledAccountCollectiblesSlugs } from './collectibles';

export const useGasToken = () => {
  const { type } = useNetwork();

  return useMemo(
    () =>
      type === 'dcp'
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
    [type]
  );
};
