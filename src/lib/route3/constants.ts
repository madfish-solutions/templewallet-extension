import { BigNumber } from 'bignumber.js';

import { Route3Token, Route3TokenStandardEnum } from 'lib/apis/route3/fetch-route3-tokens';

import { getPercentageRatio } from './utils/get-percentage-ratio';

export const ROUTE3_CONTRACT = 'KT1Tuta6vbpHhZ15ixsYD3qJdhnpEAuogLQ9';
export const ROUTING_FEE_ADDRESS = 'tz1burnburnburnburnburnburnburjAYjjX';

const ROUTING_FEE_PERCENT = 0.35;
export const ROUTING_FEE_RATIO = getPercentageRatio(ROUTING_FEE_PERCENT);

export const ZERO = new BigNumber(0);
export const TEMPLE_TOKEN: Route3Token = {
  id: 49,
  symbol: 'UBTC',
  standard: Route3TokenStandardEnum.fa2,
  contract: 'KT1XRPEPXbZK25r3Htzp2o1x7xdMMmfocKNW',
  tokenId: '2',
  decimals: 12
};
