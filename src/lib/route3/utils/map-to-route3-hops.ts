import { BigNumber } from 'bignumber.js';

import { Hop, Route3Hop } from 'lib/route3/interfaces';

export const mapToRoute3ExecuteHops = (hops: Route3Hop[]): Hop[] =>
  hops.map(({ dexId, tokenInAmount, tradingBalanceAmount, code, params }) => ({
    dex_id: dexId,
    code,
    amount_from_token_in_reserves: new BigNumber(tokenInAmount),
    amount_from_trading_balance: new BigNumber(tradingBalanceAmount),
    params: params ?? ''
  }));
