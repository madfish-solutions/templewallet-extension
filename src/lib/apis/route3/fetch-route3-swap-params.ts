import { EnvVars } from 'lib/env';

export interface Route3SwapParamsRequestRaw {
  fromSymbol: string;
  toSymbol: string;
  amount: string | undefined;
  chainsLimit?: string;
}
export interface Route3SwapParamsRequest {
  fromSymbol: string;
  toSymbol: string;
  amount: string;
  chainsLimit?: number;
}

interface Route3Hop {
  dex: number;
  forward: boolean;
}

export interface Route3Chain {
  input: string;
  output: string;
  hops: Array<Route3Hop>;
}

export interface Route3SwapParamsResponse {
  input: string | undefined;
  output: string | undefined;
  chains: Array<Route3Chain>;
}

const parser = (origJSON: string): ReturnType<typeof JSON['parse']> => {
  const stringedJSON = origJSON
    .replace(/input":\s*([-+Ee0-9.]+)/g, 'input":"$1"')
    .replace(/output":\s*([-+Ee0-9.]+)/g, 'output":"$1"');

  return JSON.parse(stringedJSON);
};

export const fetchRoute3SwapParams = ({
  fromSymbol,
  toSymbol,
  amount,
  chainsLimit = 3
}: Route3SwapParamsRequest): Promise<Route3SwapParamsResponse> =>
  fetch(`https://temple.3route.io/swap/${fromSymbol}/${toSymbol}/${amount}?chainsLimit=${chainsLimit}`, {
    headers: {
      Authorization: EnvVars.TEMPLE_WALLET_ROUTE3_AUTH_TOKEN
    }
  })
    .then(res => res.text())
    .then(res => parser(res));
