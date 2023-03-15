import { createEntity } from 'lib/store';

import { SwapState } from './state';

export const mockSwapState: SwapState = {
  dexes: createEntity([]),
  tokens: createEntity([])
};
