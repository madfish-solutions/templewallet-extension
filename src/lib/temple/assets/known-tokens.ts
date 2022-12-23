import { TempleChainId } from 'lib/temple/types';

import { toTokenSlug } from './utils';

export const KNOWN_TOKENS_SLUGS = {
  tzBTC: toTokenSlug('KT1PWx2mnDueood7fEmfbBDKx1D9BAnnXitn', 0),
  KUSD: toTokenSlug('KT1K9gCRgaLRFKTErYt1wVxA3Frb9FjasjTV', 0),
  uUSD: toTokenSlug('KT1XRPEPXbZK25r3Htzp2o1x7xdMMmfocKNW', 0),
  QUIPU: toTokenSlug('KT193D4vozYnhGJQVtw7CoxxqphqUEEwK6Vb', 0),
  wWBTC: toTokenSlug('KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ', 19),
  USDT: toTokenSlug('KT1XnTn74bUtxHfDtBmm2bGZAQfhPbvKWR8o', 0),
  uBTC: toTokenSlug('KT1XRPEPXbZK25r3Htzp2o1x7xdMMmfocKNW', 2),
  YOU: toTokenSlug('KT1Xobej4mc6XgEjDoJoHtTKgbD1ELMvcQuL', 0)
};

const PREDEFINED_TOKENS_BY_CHAIN_ID: Record<string, string[]> = {
  [TempleChainId.Mainnet]: [
    KNOWN_TOKENS_SLUGS.USDT,
    KNOWN_TOKENS_SLUGS.uUSD,
    KNOWN_TOKENS_SLUGS.KUSD,
    KNOWN_TOKENS_SLUGS.tzBTC,
    KNOWN_TOKENS_SLUGS.uBTC,
    KNOWN_TOKENS_SLUGS.QUIPU,
    KNOWN_TOKENS_SLUGS.YOU
  ],
  [TempleChainId.Dcp]: ['KT1N7Rh6SgSdExMPxfnYw1tHqrkSm7cm6JDN_0']
};

export const getPredefinedTokensSlugs = (chainId: string) => PREDEFINED_TOKENS_BY_CHAIN_ID[chainId] ?? [];

export const TOKENS_BRAND_COLORS: Record<string, { bg: string; bgHover?: string }> = {
  [KNOWN_TOKENS_SLUGS.KUSD]: { bg: '#3EBD93', bgHover: '#65CAA9' },
  [KNOWN_TOKENS_SLUGS.tzBTC]: { bg: '#1373E4', bgHover: '#428FE9' },
  [KNOWN_TOKENS_SLUGS.USDT]: { bg: '#009393', bgHover: '#52AF95' }
};
