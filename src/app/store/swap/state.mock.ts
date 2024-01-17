import { Route3SwapParamsResponse } from 'lib/route3/interfaces';
import { createEntity } from 'lib/store';

import type { SwapState } from './state';

export const DEFAULT_SWAP_PARAMS: Route3SwapParamsResponse = { input: undefined, output: undefined, chains: [] };

export const mockSwapState: SwapState = {
  swapParams: createEntity(DEFAULT_SWAP_PARAMS),

  dexes: createEntity([]),
  tokens: createEntity([])
};
