import { useNetwork } from 'lib/temple/front';
import { FILM_METADATA, TEZOS_METADATA } from 'lib/temple/metadata/defaults';

export const useGasToken = () => {
  const network = useNetwork();

  return network.type === 'dcp'
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
      };
};
