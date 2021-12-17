import { BigNumber } from 'bignumber.js';

export function toTokenSlug(contract: string, id: BigNumber = new BigNumber(0)) {
  return `${contract}_${id.toFixed()}`;
}
