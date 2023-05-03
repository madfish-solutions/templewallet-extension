import { TokenMetadata, TokenStandardsEnum } from 'lib/metadata/types';
import { TempleChainId } from 'lib/temple/types';

import { toAssetSlug } from './index';

export namespace KNOWN_TOKENS_SLUGS {
  export const TZBTC = toAssetSlug('KT1PWx2mnDueood7fEmfbBDKx1D9BAnnXitn', 0);
  export const KUSD = toAssetSlug('KT1K9gCRgaLRFKTErYt1wVxA3Frb9FjasjTV', 0);
  export const UUSD = toAssetSlug('KT1XRPEPXbZK25r3Htzp2o1x7xdMMmfocKNW', 0);
  export const QUIPU = toAssetSlug('KT193D4vozYnhGJQVtw7CoxxqphqUEEwK6Vb', 0);
  export const WWBTC = toAssetSlug('KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ', 19);
  export const USDT = toAssetSlug('KT1XnTn74bUtxHfDtBmm2bGZAQfhPbvKWR8o', 0);
  export const UBTC = toAssetSlug('KT1XRPEPXbZK25r3Htzp2o1x7xdMMmfocKNW', 2);
  export const YOU = toAssetSlug('KT1Xobej4mc6XgEjDoJoHtTKgbD1ELMvcQuL', 0);
  export const SIRS = toAssetSlug('KT1AafHA1C1vk959wvHWBispY9Y2f3fxBUUo', 0);
}

const PREDEFINED_TOKENS_BY_CHAIN_ID: Record<string, string[]> = {
  [TempleChainId.Mainnet]: [
    KNOWN_TOKENS_SLUGS.USDT,
    KNOWN_TOKENS_SLUGS.UUSD,
    KNOWN_TOKENS_SLUGS.KUSD,
    KNOWN_TOKENS_SLUGS.TZBTC,
    KNOWN_TOKENS_SLUGS.UBTC,
    KNOWN_TOKENS_SLUGS.QUIPU,
    KNOWN_TOKENS_SLUGS.YOU
  ],
  [TempleChainId.Dcp]: ['KT1N7Rh6SgSdExMPxfnYw1tHqrkSm7cm6JDN_0']
};

export const getPredefinedTokensSlugs = (chainId: string) => PREDEFINED_TOKENS_BY_CHAIN_ID[chainId] ?? [];

export const TOKENS_BRAND_COLORS: Record<string, { bg: string; bgHover?: string }> = {
  [KNOWN_TOKENS_SLUGS.KUSD]: { bg: '#3EBD93', bgHover: '#65CAA9' },
  [KNOWN_TOKENS_SLUGS.TZBTC]: { bg: '#1373E4', bgHover: '#428FE9' },
  [KNOWN_TOKENS_SLUGS.USDT]: { bg: '#009393', bgHover: '#52AF95' }
};

export const LOCAL_MAINNET_TOKENS_METADATA: TokenMetadata[] = [
  {
    id: 0,
    address: 'KT1XnTn74bUtxHfDtBmm2bGZAQfhPbvKWR8o',
    name: 'Tether USD',
    symbol: 'USDt',
    decimals: 6,
    thumbnailUri: 'ipfs://QmRymVGWEudMfLrbjaEiXxngCRTDgWCsscjQMwizy4ZJjX',
    standard: TokenStandardsEnum.Fa2
  },
  {
    id: 0,
    address: 'KT1XRPEPXbZK25r3Htzp2o1x7xdMMmfocKNW',
    name: 'youves uUSD',
    symbol: 'uUSD',
    decimals: 12,
    thumbnailUri: 'ipfs://QmbvhanNCxydZEbGu1RdqkG3LcpNGv7XYsCHgzWBXnmxRd',
    standard: TokenStandardsEnum.Fa2
  },
  {
    id: 0,
    address: 'KT1K9gCRgaLRFKTErYt1wVxA3Frb9FjasjTV',
    name: 'Kolibri',
    symbol: 'kUSD',
    decimals: 18,
    thumbnailUri: 'https://kolibri-data.s3.amazonaws.com/logo.png',
    standard: TokenStandardsEnum.Fa12
  },
  {
    id: 0,
    address: 'KT1PWx2mnDueood7fEmfbBDKx1D9BAnnXitn',
    name: 'Tezos BTC',
    symbol: 'tzBTC',
    decimals: 8,
    // iconName: IconNameEnum.TzBtcToken,
    standard: TokenStandardsEnum.Fa12
  },
  {
    id: 2,
    address: 'KT1XRPEPXbZK25r3Htzp2o1x7xdMMmfocKNW',
    name: 'youves uBTC',
    symbol: 'uBTC',
    decimals: 12,
    thumbnailUri: 'ipfs://Qmbev41h4axBqVzxsXP2NSaAF996bJjJBPb8FFZVqTvJTY',
    standard: TokenStandardsEnum.Fa2
  },
  {
    id: 0,
    address: 'KT193D4vozYnhGJQVtw7CoxxqphqUEEwK6Vb',
    name: 'Quipuswap governance token',
    symbol: 'QUIPU',
    decimals: 6,
    thumbnailUri: 'ipfs://Qmb2GiHN9EjcrN29J6y9PsXu3ZDosXTv6uLUWGZfRRSzS2/quipu.png',
    standard: TokenStandardsEnum.Fa2
  },
  {
    id: 0,
    address: 'KT1Xobej4mc6XgEjDoJoHtTKgbD1ELMvcQuL',
    name: 'youves YOU Governance',
    symbol: 'YOU',
    decimals: 12,
    thumbnailUri: 'ipfs://QmYAJaJvEJuwvMEgRbBoAUKrTxRTT22nCC9RuY7Jy4L4Gc',
    standard: TokenStandardsEnum.Fa2
  }
];

export const DCP_TOKENS_METADATA: TokenMetadata[] = [
  {
    id: 0,
    address: 'KT1N7Rh6SgSdExMPxfnYw1tHqrkSm7cm6JDN',
    decimals: 0,
    symbol: 'APX',
    name: 'APXCOIN',
    thumbnailUri: 'https://loonfilms.com/apx/apx-coin-220px.png',
    standard: TokenStandardsEnum.Fa2
  }
];
