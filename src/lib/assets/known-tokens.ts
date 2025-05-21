import { TokenMetadata, MetadataRecords, TezosTokenStandardsEnum } from 'lib/metadata/types';
import { TempleTezosChainId } from 'lib/temple/types';

import { FA2Token } from './types';
import { tokenToSlug, toTokenSlug } from './utils';

export const TempleToken: FA2Token = {
  contract: 'KT1VaEsVNiBoA56eToEK6n6BcPgh1tdx9eXi',
  id: '0'
};

export const TEMPLE_TOKEN_SLUG = toTokenSlug(TempleToken.contract, TempleToken.id);

export namespace KNOWN_TOKENS_SLUGS {
  export const TZBTC = toTokenSlug('KT1PWx2mnDueood7fEmfbBDKx1D9BAnnXitn', 0);
  export const KUSD = toTokenSlug('KT1K9gCRgaLRFKTErYt1wVxA3Frb9FjasjTV', 0);
  export const UUSD = toTokenSlug('KT1XRPEPXbZK25r3Htzp2o1x7xdMMmfocKNW', 0);
  export const QUIPU = toTokenSlug('KT193D4vozYnhGJQVtw7CoxxqphqUEEwK6Vb', 0);
  export const USDT = toTokenSlug('KT1XnTn74bUtxHfDtBmm2bGZAQfhPbvKWR8o', 0);
  export const UBTC = toTokenSlug('KT1XRPEPXbZK25r3Htzp2o1x7xdMMmfocKNW', 2);
  export const YOU = toTokenSlug('KT1Xobej4mc6XgEjDoJoHtTKgbD1ELMvcQuL', 0);
  export const SIRS = toTokenSlug('KT1AafHA1C1vk959wvHWBispY9Y2f3fxBUUo', 0);
  export const TEMPLE = toTokenSlug(TempleToken.contract, TempleToken.id);
}

const DEPRECATED_TKEY_METADATA: TokenMetadata = {
  id: '0',
  address: 'KT1WihWRnmzhfebi6zqQ4tvNGiPeVxiGwTi2',
  name: 'Deprecated Temple Key',
  symbol: 'TKEY_OLD',
  decimals: 18,
  standard: TezosTokenStandardsEnum.Fa2
};

export const TZBTC_TOKEN_METADATA: TokenMetadata = {
  id: '0',
  address: 'KT1PWx2mnDueood7fEmfbBDKx1D9BAnnXitn',
  name: 'Tezos BTC',
  symbol: 'tzBTC',
  decimals: 8,
  thumbnailUri: 'https://tzbtc.io/wp-content/uploads/2020/03/tzbtc_logo_single.svg',
  standard: TezosTokenStandardsEnum.Fa12
};

const PREDEFINED_MAINNET_TOKENS_METADATA: TokenMetadata[] = [
  {
    id: '0',
    address: 'KT1VaEsVNiBoA56eToEK6n6BcPgh1tdx9eXi',
    name: 'Temple Key',
    symbol: 'TKEY',
    decimals: 18,
    thumbnailUri: 'ipfs://Qmb9QUXYn1PW8e7E2CwpBMgEur7gFAPPpq2Zh7H2D7eQcT',
    standard: TezosTokenStandardsEnum.Fa2
  },
  {
    id: '0',
    address: 'KT1XnTn74bUtxHfDtBmm2bGZAQfhPbvKWR8o',
    name: 'Tether USD',
    symbol: 'USDt',
    decimals: 6,
    thumbnailUri: 'ipfs://QmRymVGWEudMfLrbjaEiXxngCRTDgWCsscjQMwizy4ZJjX',
    standard: TezosTokenStandardsEnum.Fa2
  },
  {
    id: '0',
    address: 'KT1K9gCRgaLRFKTErYt1wVxA3Frb9FjasjTV',
    name: 'Kolibri',
    symbol: 'kUSD',
    decimals: 18,
    thumbnailUri: 'https://kolibri-data.s3.amazonaws.com/logo.png',
    standard: TezosTokenStandardsEnum.Fa12
  },
  TZBTC_TOKEN_METADATA,
  {
    id: '0',
    address: 'KT193D4vozYnhGJQVtw7CoxxqphqUEEwK6Vb',
    name: 'Quipuswap governance token',
    symbol: 'QUIPU',
    decimals: 6,
    thumbnailUri: 'ipfs://Qmb2GiHN9EjcrN29J6y9PsXu3ZDosXTv6uLUWGZfRRSzS2/quipu.png',
    standard: TezosTokenStandardsEnum.Fa2
  }
];

const DCP_TOKENS_METADATA: TokenMetadata[] = [
  {
    id: '0',
    address: 'KT1N7Rh6SgSdExMPxfnYw1tHqrkSm7cm6JDN',
    decimals: 0,
    symbol: 'APX',
    name: 'APXCOIN',
    thumbnailUri: 'https://loonfilms.com/apx/apx-coin-220px.png',
    standard: TezosTokenStandardsEnum.Fa2
  }
];

export const PREDEFINED_TOKENS_METADATA: Record<string, TokenMetadata[]> = {
  [TempleTezosChainId.Mainnet]: PREDEFINED_MAINNET_TOKENS_METADATA,
  [TempleTezosChainId.Dcp]: DCP_TOKENS_METADATA
};

export const ALL_PREDEFINED_METADATAS_RECORD: MetadataRecords = [
  ...PREDEFINED_MAINNET_TOKENS_METADATA,
  DEPRECATED_TKEY_METADATA,
  ...DCP_TOKENS_METADATA
].reduce(
  (obj, tokenMetadata) => ({
    ...obj,
    [tokenToSlug(tokenMetadata)]: tokenMetadata
  }),
  {}
);
