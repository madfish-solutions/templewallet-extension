import { BigNumber } from 'bignumber.js';

import { Hop, Route3Hop } from 'lib/route3/interfaces';

export const mapToRoute3ExecuteHops = (hops: Route3Hop[]): Record<string, Hop> => {
  const result: Record<string, Hop> = {};

  hops.forEach(({ dexId, tokenInAmount, tradingBalanceAmount, code, params }, index) => {
    result[index.toString()] = {
      dex_id: dexId,
      code,
      amount_from_token_in_reserves: new BigNumber(tokenInAmount),
      amount_from_trading_balance: new BigNumber(tradingBalanceAmount),
      params: params ?? ''
    };
  });

  return result;
};
