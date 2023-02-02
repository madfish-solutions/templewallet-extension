import { from, map } from 'rxjs';

import { route3Api } from './route3.api';

export interface Route3Token {
  contract: null | string;
  decimals: number;
  id: number;
  standard: 'xtz' | 'fa12' | 'fa2';
  symbol: string;
  tokenId: null | string;
}

export const getRoute3Tokens$ = () =>
  from(route3Api.get<Array<Route3Token>>('/tokens')).pipe(map(response => response.data));
