import { Route3SwapParamsResponse } from 'lib/apis/route3/fetch-route3-swap-params';
import { createEntity } from 'lib/store';

import { SwapState } from './state';

export const DEFAULT_SWAP_PARAMS: Route3SwapParamsResponse = { input: undefined, output: undefined, chains: [] };

export const mockSwapState: SwapState = {
  swapParams: createEntity(DEFAULT_SWAP_PARAMS),

  dexes: createEntity([]),
  tokens: createEntity([])
};
