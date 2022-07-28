import { FILM_METADATA, TEZOS_METADATA, useNetwork } from '../../lib/temple/front';

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
