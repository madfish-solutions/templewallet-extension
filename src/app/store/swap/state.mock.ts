import { Route3SwapParamsResponse } from 'lib/route3/interfaces';
import { createEntity, mockPersistedState } from 'lib/store';

import type { SwapState } from './state';

export const DEFAULT_SWAP_PARAMS: Route3SwapParamsResponse = { input: undefined, output: undefined, hops: [] };

export const mockSwapState = mockPersistedState<SwapState>({
  swapParams: createEntity(DEFAULT_SWAP_PARAMS),

  dexes: createEntity([]),
  tokens: createEntity([])
});
