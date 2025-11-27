import { KNOWN_TOKENS_SLUGS } from 'lib/assets/known-tokens';

const YUPANA_LEND_LINK = 'https://app.yupana.finance/lending';
const YOUVES_LINK = 'https://app.youves.com/earn';

export interface EarnOpportunity {
  /** Token slug used to fetch APY rate dynamically */
  slug: string;
  /** Display symbol for the token */
  symbol: string;
  /** APY or APR label */
  rateType: 'APY' | 'APR';
  /** Static fallback rate if dynamic rate is unavailable */
  fallbackRate?: number;
  /** External link for the earn opportunity */
  link: string;
  /** Network name for display */
  networkName: string;
}

export const EARN_OPPORTUNITIES: EarnOpportunity[] = [
  {
    slug: KNOWN_TOKENS_SLUGS.KUSD,
    symbol: 'kUSD',
    rateType: 'APY',
    link: YUPANA_LEND_LINK,
    networkName: 'Tezos'
  },
  {
    slug: KNOWN_TOKENS_SLUGS.USDT,
    symbol: 'USDt',
    rateType: 'APY',
    link: YUPANA_LEND_LINK,
    networkName: 'Tezos'
  },
  {
    slug: KNOWN_TOKENS_SLUGS.TZBTC,
    symbol: 'tzBTC',
    rateType: 'APY',
    link: YUPANA_LEND_LINK,
    networkName: 'Tezos'
  },
  {
    slug: KNOWN_TOKENS_SLUGS.UUSD,
    symbol: 'uUSD',
    rateType: 'APR',
    link: YOUVES_LINK,
    networkName: 'Tezos'
  },
  {
    slug: KNOWN_TOKENS_SLUGS.UBTC,
    symbol: 'uBTC',
    rateType: 'APR',
    link: YOUVES_LINK,
    networkName: 'Tezos'
  },
  {
    slug: KNOWN_TOKENS_SLUGS.YOU,
    symbol: 'YOU',
    rateType: 'APR',
    link: YOUVES_LINK,
    networkName: 'Tezos'
  }
];

/** Number of items visible at once in the carousel */
export const VISIBLE_ITEMS_COUNT = 2;

/** Carousel auto-rotation interval in milliseconds */
export const CAROUSEL_INTERVAL_MS = 3000;

/** Carousel transition duration in milliseconds */
export const CAROUSEL_TRANSITION_MS = 200;

