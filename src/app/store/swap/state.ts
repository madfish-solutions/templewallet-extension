import { Route3Dex } from 'lib/apis/route3/fetch-route3-dexes';
import { Route3Token } from 'lib/apis/route3/fetch-route3-tokens';
import { createEntity, LoadableEntityState } from 'lib/store';

export interface SwapState {
  dexes: LoadableEntityState<Array<Route3Dex>>;
  tokens: LoadableEntityState<Array<Route3Token>>;
}

export const swapInitialState: SwapState = {
  dexes: createEntity([]),
  tokens: createEntity([])
};
