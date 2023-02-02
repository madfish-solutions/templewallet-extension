import { Route3Token } from 'lib/apis/route3/get-route3-tokens';
import { createEntity, LoadableEntityState } from 'lib/store';

interface Route3State {
  tokens: LoadableEntityState<Array<Route3Token>>;
}

export const route3InitialState: Route3State = {
  tokens: createEntity([])
};

export interface Route3RootState {
  route3: Route3State;
}
