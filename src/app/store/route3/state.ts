import { Route3Token } from 'lib/apis/route3/get-route3-tokens';
import { createEntity, LoadableEntityState } from 'lib/store';

export interface Route3State {
  tokens: LoadableEntityState<Array<Route3Token>>;
}

export const route3InitialState: Route3State = {
  tokens: createEntity([])
};
