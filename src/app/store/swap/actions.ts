import { Route3Dex } from 'lib/apis/route3/fetch-route3-dexes';
import { Route3Token } from 'lib/apis/route3/fetch-route3-tokens';
import { createActions } from 'lib/store';

export const loadSwapTokensAction = createActions<void, Array<Route3Token>, string>('swap/LOAD_ROUTE3_TOKENS');
export const loadSwapDexesAction = createActions<void, Array<Route3Dex>, string>('swap/LOAD_ROUTE3_DEXES');
