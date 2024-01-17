import { BigNumber } from 'bignumber.js';

import { Hop, Route3Chain } from 'lib/route3/interfaces';
import { tokensToAtoms } from 'lib/temple/helpers';

export const mapToRoute3ExecuteHops = (chains: Array<Route3Chain>, decimals: number) => {
  const hops = new Array<Hop>();

  for (const chain of chains) {
    for (let j = 0; j < chain.hops.length; j++) {
      const hop = chain.hops[j];
      hops.push({
        code: (j === 0 ? 1 : 0) + (hop.forward ? 2 : 0),
        dex_id: hop.dex,
        amount_opt: j === 0 ? tokensToAtoms(new BigNumber(chain.input), decimals) : null,
        params: ''
      });
    }
  }

  return hops;
};
