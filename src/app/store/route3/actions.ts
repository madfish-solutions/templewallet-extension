import { Route3Token } from 'lib/apis/route3/get-route3-tokens';
import { createActions } from 'lib/store';

export const loadRoute3TokensAction = createActions<void, Array<Route3Token>, string>('route3/LOAD_ROUTE3_TOKENS');
