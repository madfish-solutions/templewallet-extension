import { Route3Token, Route3TokenStandardEnum } from 'lib/apis/route3/fetch-route3-tokens';
import { TempleToken } from 'lib/assets/known-tokens';

export const ROUTE3_CONTRACT = 'KT1V5XKmeypanMS9pR65REpqmVejWBZURuuT';
export const BURN_ADDREESS = 'tz1burnburnburnburnburnburnburjAYjjX';
export const ROUTING_FEE_ADDRESS = 'tz1UbRzhYjQKTtWYvGUWcRtVT4fN3NESDVYT';

export const SIRS_LIQUIDITY_SLIPPAGE_RATIO = 0.9999;
export const ROUTING_FEE_RATIO = 0.006;
export const SWAP_CASHBACK_RATIO = 0.003;
export const ROUTING_FEE_SLIPPAGE_RATIO = 0.995;
export const SWAP_THRESHOLD_TO_GET_CASHBACK = 10;
/** The measure of acceptable deviation of an input for cashback swap or an amount of tokens to burn or to send to
 * `ROUTING_FEE_ADDRESS` from ideal caused by the discretion of tokens values.
 */
const MAX_FEE_OR_CASHBACK_DEVIATION_RATIO = 0.01;

export const ATOMIC_INPUT_THRESHOLD_FOR_FEE_FROM_INPUT = Math.ceil(
  1 / MAX_FEE_OR_CASHBACK_DEVIATION_RATIO / Math.min(SWAP_CASHBACK_RATIO, ROUTING_FEE_RATIO - SWAP_CASHBACK_RATIO)
);

export const TEMPLE_TOKEN: Route3Token = {
  id: 138,
  symbol: 'TKEY',
  standard: Route3TokenStandardEnum.fa2,
  contract: TempleToken.contract,
  tokenId: String(TempleToken.id),
  decimals: 18
};

export const APP_ID = 2;
