import { Route3SwapParamsResponse, Route3TreeNodeType } from 'lib/route3/interfaces';
import { createEntity, mockPersistedState } from 'lib/store';

import type { SwapState } from './state';

export const DEFAULT_SWAP_PARAMS: Route3SwapParamsResponse = {
  input: undefined,
  output: undefined,
  hops: [],
  tree: {
    type: Route3TreeNodeType.Empty,
    items: [],
    dexId: null,
    tokenInId: 0,
    tokenOutId: 1,
    tokenInAmount: '0',
    tokenOutAmount: '0',
    width: 0,
    height: 0
  }
};

export const mockSwapState = mockPersistedState<SwapState>({
  swapParams: createEntity(DEFAULT_SWAP_PARAMS),

  dexes: createEntity([]),
  tokens: createEntity([])
});
