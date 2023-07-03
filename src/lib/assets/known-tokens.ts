import { TokenMetadata, TokenStandardsEnum } from 'lib/metadata/types';
import { TempleChainId } from 'lib/temple/types';

import { toTokenSlug } from './index';
import { FA2Token } from './types';

export const TempleToken: FA2Token = {
  contract: 'KT1VaEsVNiBoA56eToEK6n6BcPgh1tdx9eXi',
  id: 0
};

export namespace KNOWN_TOKENS_SLUGS {
  export const TZBTC = toTokenSlug('KT1PWx2mnDueood7fEmfbBDKx1D9BAnnXitn', 0);
  export const KUSD = toTokenSlug('KT1K9gCRgaLRFKTErYt1wVxA3Frb9FjasjTV', 0);
  export const UUSD = toTokenSlug('KT1XRPEPXbZK25r3Htzp2o1x7xdMMmfocKNW', 0);
  export const QUIPU = toTokenSlug('KT193D4vozYnhGJQVtw7CoxxqphqUEEwK6Vb', 0);
  export const WWBTC = toTokenSlug('KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ', 19);
  export const USDT = toTokenSlug('KT1XnTn74bUtxHfDtBmm2bGZAQfhPbvKWR8o', 0);
  export const UBTC = toTokenSlug('KT1XRPEPXbZK25r3Htzp2o1x7xdMMmfocKNW', 2);
  export const YOU = toTokenSlug('KT1Xobej4mc6XgEjDoJoHtTKgbD1ELMvcQuL', 0);
  export const SIRS = toTokenSlug('KT1AafHA1C1vk959wvHWBispY9Y2f3fxBUUo', 0);
  export const TEMPLE = toTokenSlug(TempleToken.contract, TempleToken.id);
}

const PREDEFINED_TOKENS_BY_CHAIN_ID: Record<string, string[]> = {
  [TempleChainId.Mainnet]: [
    KNOWN_TOKENS_SLUGS.TEMPLE,
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
  [KNOWN_TOKENS_SLUGS.USDT]: { bg: '#009393', bgHover: '#52AF95' },
  [KNOWN_TOKENS_SLUGS.UUSD]: { bg: '#143A3A', bgHover: '#4F6B6B' },
  [KNOWN_TOKENS_SLUGS.UBTC]: { bg: '#143A3A', bgHover: '#4F6B6B' },
  [KNOWN_TOKENS_SLUGS.YOU]: { bg: '#143A3A', bgHover: '#4F6B6B' }
};

export const DEPRECATED_TKEY_METADATA: TokenMetadata = {
  id: 0,
  address: 'KT1WihWRnmzhfebi6zqQ4tvNGiPeVxiGwTi2',
  name: 'Deprecated Temple Key',
  symbol: 'TKEY_OLD',
  decimals: 18,
  standard: TokenStandardsEnum.Fa2
};

export const LOCAL_MAINNET_TOKENS_METADATA: TokenMetadata[] = [
  DEPRECATED_TKEY_METADATA,
  {
    id: 0,
    address: 'KT1VaEsVNiBoA56eToEK6n6BcPgh1tdx9eXi',
    name: 'Temple Key',
    symbol: 'TKEY',
    decimals: 18,
    thumbnailUri: 'ipfs://Qmb9QUXYn1PW8e7E2CwpBMgEur7gFAPPpq2Zh7H2D7eQcT',
    standard: TokenStandardsEnum.Fa2
  },
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
    thumbnailUri: 'https://tzbtc.io/wp-content/uploads/2020/03/tzbtc_logo_single.svg',
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
