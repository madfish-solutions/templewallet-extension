import { Route3Dex } from 'lib/apis/route3/fetch-route3-dexes';
import { Route3Token } from 'lib/apis/route3/fetch-route3-tokens';
import { Route3SwapParamsResponse } from 'lib/route3/interfaces';
import { createEntity, LoadableEntityState } from 'lib/store';

import { DEFAULT_SWAP_PARAMS } from './state.mock';

export interface SwapState {
  swapParams: LoadableEntityState<Route3SwapParamsResponse>;

  dexes: LoadableEntityState<Array<Route3Dex>>;
  tokens: LoadableEntityState<Array<Route3Token>>;
}

export const swapInitialState: SwapState = {
  swapParams: createEntity(DEFAULT_SWAP_PARAMS),
  dexes: createEntity([]),
  tokens: createEntity([])
};
