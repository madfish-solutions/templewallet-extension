import { THREE_ROUTE_SIRS_TOKEN } from 'lib/assets/three-route-tokens';
import { EnvVars } from 'lib/env';
import {
  Route3LiquidityBakingParamsResponse,
  Route3SwapParamsRequest,
  Route3TraditionalSwapParamsResponse
} from 'lib/route3/interfaces';

const parser = (origJSON: string): ReturnType<typeof JSON['parse']> => {
  const stringedJSON = origJSON
    .replace(/input":\s*([-+Ee0-9.]+)/g, 'input":"$1"')
    .replace(/output":\s*([-+Ee0-9.]+)/g, 'output":"$1"');

  return JSON.parse(stringedJSON);
};

const fetchRoute3TraditionalSwapParams = ({
  fromSymbol,
  toSymbol,
  amount,
  chainsLimit = 2
}: Route3SwapParamsRequest): Promise<Route3TraditionalSwapParamsResponse> =>
  fetch(`https://temple.3route.io/v3/swap/${fromSymbol}/${toSymbol}/${amount}?chainsLimit=${chainsLimit}`, {
    headers: {
      Authorization: EnvVars.TEMPLE_WALLET_ROUTE3_AUTH_TOKEN
    }
  })
    .then(res => res.text())
    .then(res => parser(res));

const fetchRoute3LiquidityBakingParams = ({
  fromSymbol,
  toSymbol,
  amount,
  chainsLimit = 2
}: Route3SwapParamsRequest): Promise<Route3LiquidityBakingParamsResponse> =>
  fetch(`https://temple.3route.io/v3/swap-sirs/${fromSymbol}/${toSymbol}/${amount}?chainsLimit=${chainsLimit}`, {
    headers: {
      Authorization: EnvVars.TEMPLE_WALLET_ROUTE3_AUTH_TOKEN
    }
  })
    .then(res => res.text())
    .then(res => parser(res));

export const fetchRoute3SwapParams = (params: Route3SwapParamsRequest) =>
  [params.fromSymbol, params.toSymbol].includes(THREE_ROUTE_SIRS_TOKEN.symbol)
    ? fetchRoute3LiquidityBakingParams(params)
    : fetchRoute3TraditionalSwapParams(params);
