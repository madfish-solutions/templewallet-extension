import { from, map } from 'rxjs';

import { route3Api } from './route3.api';

export interface Route3SwapParamsRequest {
  fromSymbol: string;
  toSymbol: string;
  amount: string;
}

interface Route3Hop {
  dex: number;
  forward: boolean;
}

export interface Route3Chain {
  input: number;
  output: number;
  hops: Array<Route3Hop>;
}

export interface Route3SwapParamsResponse {
  input: number | undefined;
  output: number | undefined;
  chains: Array<Route3Chain>;
}

export const fetchRoute3SwapParams$ = ({ fromSymbol, toSymbol, amount }: Route3SwapParamsRequest) =>
  from(route3Api.get<Route3SwapParamsResponse>(`/swap/${fromSymbol}/${toSymbol}/${amount}`)).pipe(
    map(response => response.data)
  );