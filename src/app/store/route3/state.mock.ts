import { createEntity } from 'lib/store';

import { Route3State } from './state';

export const route3StateMock: Route3State = {
  dexes: createEntity([]),
  tokens: createEntity([]),
  swapParams: createEntity({ input: 0, output: 0, chains: [] })
};
