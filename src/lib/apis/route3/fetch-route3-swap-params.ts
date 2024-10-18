import { transform } from 'lodash';

import { THREE_ROUTE_SIRS_TOKEN } from 'lib/assets/three-route-tokens';
import { EnvVars } from 'lib/env';
import {
  Route3LbSwapParamsRequest,
  Route3LiquidityBakingParamsResponse,
  Route3SwapParamsRequest,
  Route3TraditionalSwapParamsResponse
} from 'lib/route3/interfaces';

import { ROUTE3_BASE_URL } from './route3.api';

const parser = (origJSON: string): ReturnType<typeof JSON['parse']> => {
  const stringedJSON = origJSON
    .replace(/input":\s*([-+Ee0-9.]+)/g, 'input":"$1"')
    .replace(/output":\s*([-+Ee0-9.]+)/g, 'output":"$1"');

  return JSON.parse(stringedJSON);
};

function getRoute3ParametrizedUrlPart(params: Route3SwapParamsRequest): string;
function getRoute3ParametrizedUrlPart(params: Route3LbSwapParamsRequest): string;
function getRoute3ParametrizedUrlPart(params: Route3SwapParamsRequest | Route3LbSwapParamsRequest) {
  const { fromSymbol, toSymbol, amount, ...queryParams } = params;
  const searchParams = new URLSearchParams(
    transform<typeof queryParams, StringRecord>(
      queryParams,
      (res, value, key) => {
        res[key] = String(value);
      },
      {}
    )
  );

  return `/${fromSymbol}/${toSymbol}/${amount}?${searchParams.toString()}`;
}

const fetchRoute3TraditionalSwapParams = (
  params: Route3SwapParamsRequest
): Promise<Route3TraditionalSwapParamsResponse> =>
  fetch(`${ROUTE3_BASE_URL}/swap${getRoute3ParametrizedUrlPart(params)}`, {
    headers: {
      Authorization: EnvVars.TEMPLE_WALLET_ROUTE3_AUTH_TOKEN
    }
  })
    .then(res => res.text())
    .then(res => parser(res));

const fetchRoute3LiquidityBakingParams = (
  params: Route3LbSwapParamsRequest
): Promise<Route3LiquidityBakingParamsResponse> =>
  fetch(`${ROUTE3_BASE_URL}/swap-sirs${getRoute3ParametrizedUrlPart(params)}`, {
    headers: {
      Authorization: EnvVars.TEMPLE_WALLET_ROUTE3_AUTH_TOKEN
    }
  })
    .then(res => res.text())
    .then(res => parser(res));

export const fetchRoute3SwapParams = ({ fromSymbol, toSymbol, amount, dexesLimit }: Route3SwapParamsRequest) =>
  [fromSymbol, toSymbol].includes(THREE_ROUTE_SIRS_TOKEN.symbol)
    ? fetchRoute3LiquidityBakingParams({
        fromSymbol,
        toSymbol,
        amount,
        xtzDexesLimit: Math.ceil(dexesLimit / 2),
        tzbtcDexesLimit: Math.floor(dexesLimit / 2)
      })
    : fetchRoute3TraditionalSwapParams({ fromSymbol, toSymbol, amount, dexesLimit });
