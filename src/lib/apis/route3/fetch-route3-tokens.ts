import { from, map } from 'rxjs';

import { route3Api } from './route3.api';

export enum Route3TokenStandardEnum {
  xtz = 'xtz',
  fa2 = 'fa2',
  fa12 = 'fa12'
}

export interface Route3Token {
  contract: null | string;
  decimals: number;
  id: number;
  standard: Route3TokenStandardEnum;
  symbol: string;
  tokenId: null | string;
}

export const fetchgetRoute3Tokens = () =>
  from(route3Api.get<Array<Route3Token>>('/tokens')).pipe(map(response => response.data));
