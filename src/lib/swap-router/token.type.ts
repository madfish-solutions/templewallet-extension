import { BigNumber } from 'bignumber.js';

export type TokenType = 'tez' | { address: string } | { address: string; id: BigNumber };
