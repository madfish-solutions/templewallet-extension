import { Route3Token, Route3TokenStandardEnum } from 'lib/apis/route3/fetch-route3-tokens';
import { TempleToken } from 'lib/assets/known-tokens';

export const ROUTE3_CONTRACT = 'KT1V5XKmeypanMS9pR65REpqmVejWBZURuuT';
export const LIQUIDITY_BAKING_PROXY_CONTRACT = 'KT1DJRF7pTocLsoVgA9KQPBtrDrbzNUceSFK';
export const BURN_ADDREESS = 'tz1burnburnburnburnburnburnburjAYjjX';
export const ROUTING_FEE_ADDRESS = 'tz1UbRzhYjQKTtWYvGUWcRtVT4fN3NESDVYT';

export const ROUTING_FEE_PERCENT = 0.6;
export const SWAP_CASHBACK_PERCENT = 0.3;
export const ROUTING_FEE_SLIPPAGE_RATIO = 0.995;
export const SWAP_THRESHOLD_TO_GET_CASHBACK = 10;
export const ATOMIC_INPUT_THRESHOLD_FOR_FEE_FROM_INPUT = Math.ceil(100 / ROUTING_FEE_PERCENT);

export const TEMPLE_TOKEN: Route3Token = {
  id: 138,
  symbol: 'TKEY',
  standard: Route3TokenStandardEnum.fa2,
  contract: TempleToken.contract,
  tokenId: String(TempleToken.id),
  decimals: 18
};

export const APP_ID = 2;
