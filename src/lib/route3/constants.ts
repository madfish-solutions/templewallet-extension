import { BigNumber } from 'bignumber.js';

import { Route3Token, Route3TokenStandardEnum } from 'lib/apis/route3/fetch-route3-tokens';
import { TempleToken } from 'lib/assets/known-tokens';

import { getPercentageRatio } from './utils/get-percentage-ratio';

export const ROUTE3_CONTRACT = 'KT1R7WEtNNim3YgkxPt8wPMczjH3eyhbJMtz';
export const BURN_ADDREESS = 'tz1burnburnburnburnburnburnburjAYjjX';
export const ROUTING_FEE_ADDRESS = 'tz1UbRzhYjQKTtWYvGUWcRtVT4fN3NESDVYT';

const ROUTING_FEE_PERCENT = 0.35;
export const ROUTING_FEE_RATIO = getPercentageRatio(ROUTING_FEE_PERCENT);
export const ROUTING_FEE_SLIPPAGE_RATIO = 0.995;
export const MAX_ROUTING_FEE_CHAINS = 1;
export const SWAP_THRESHOLD_TO_GET_CASHBACK = 10;

export const ZERO = new BigNumber(0);

export const TEMPLE_TOKEN: Route3Token = {
  id: 138,
  symbol: 'TKEY',
  standard: Route3TokenStandardEnum.fa2,
  contract: TempleToken.contract,
  tokenId: String(TempleToken.id),
  decimals: 18
};
