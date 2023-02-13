import { Route3Dex } from 'lib/apis/route3/fetch-route3-dexes';
import { Route3SwapParamsResponse } from 'lib/apis/route3/fetch-route3-swap-params';
import { Route3Token } from 'lib/apis/route3/fetch-route3-tokens';
import { createEntity, LoadableEntityState } from 'lib/store';

export interface Route3State {
  dexes: LoadableEntityState<Array<Route3Dex>>;
  tokens: LoadableEntityState<Array<Route3Token>>;
  swapParams: LoadableEntityState<Route3SwapParamsResponse>;
}

export const route3InitialState: Route3State = {
  dexes: createEntity([]),
  tokens: createEntity([]),
  swapParams: createEntity({ input: 0, output: 0, chains: [] })
};
