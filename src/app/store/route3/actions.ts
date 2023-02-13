import { createAction } from '@reduxjs/toolkit';

import { Route3Dex } from 'lib/apis/route3/fetch-route3-dexes';
import { Route3SwapParamsRequest, Route3SwapParamsResponse } from 'lib/apis/route3/fetch-route3-swap-params';
import { Route3Token } from 'lib/apis/route3/fetch-route3-tokens';
import { createActions } from 'lib/store';

export const loadRoute3TokensAction = createActions<void, Array<Route3Token>, string>('route3/LOAD_ROUTE3_TOKENS');
export const loadRoute3DexesAction = createActions<void, Array<Route3Dex>, string>('route3/LOAD_ROUTE3_DEXES');
export const loadRoute3SwapParamsAction = createActions<Route3SwapParamsRequest, Route3SwapParamsResponse, string>(
  'route3/LOAD_ROUTE3_SWAP_PARAMS'
);
export const resetRoute3SwapParamsAction = createAction('route3/RESET_SWAP_PARAMS');
