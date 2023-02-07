import { route3Api } from './route3.api';

interface Route3SwapParamsInterface {
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

interface Route3SwapParamsResponse {
  input: number;
  output: number;
  chains: Array<Route3Chain>;
}

export const getRoute3SwapParams = ({ fromSymbol, toSymbol, amount }: Route3SwapParamsInterface) =>
  route3Api.get<Route3SwapParamsResponse>(`/swap/${fromSymbol}/${toSymbol}/${amount}`).then(({ data }) => data);
