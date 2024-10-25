import axios from 'axios';
import BigNumber from 'bignumber.js';
import { intersection, transform } from 'lodash';
import memoizee from 'memoizee';

import { THREE_ROUTE_SIRS_TOKEN, THREE_ROUTE_TEZ_TOKEN } from 'lib/assets/three-route-tokens';
import { LIQUIDITY_BAKING_DEX_ADDRESS } from 'lib/constants';
import { EnvVars } from 'lib/env';
import { BLOCK_DURATION } from 'lib/fixed-times';
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
  const { fromSymbol, toSymbol, amount, toTokenDecimals, rpcUrl, ...queryParams } = params;
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

const getLbSubsidyCausedXtzDeviation = memoizee(
  async (rpcUrl: string) => {
    const { data: constants } = await axios.get<{ minimal_block_delay: string; liquidity_baking_subsidy: string }>(
      `${rpcUrl}/chains/main/blocks/head/context/constants`
    );
    const { minimal_block_delay: blockDuration = String(BLOCK_DURATION), liquidity_baking_subsidy: lbSubsidyPerMin } =
      constants;
    const lbSubsidyPerBlock = Math.floor(Number(lbSubsidyPerMin) / Math.floor(60 / Number(blockDuration)));
    const { data: rawSirsDexBalance } = await axios.get<string>(
      `${rpcUrl}/chains/main/blocks/head/context/contracts/${LIQUIDITY_BAKING_DEX_ADDRESS}/balance`
    );

    return lbSubsidyPerBlock / Number(rawSirsDexBalance);
  },
  { promise: true, maxAge: 1000 * 60 * 5 }
);

const fetchRoute3LiquidityBakingParams = (
  params: Route3LbSwapParamsRequest
): Promise<Route3LiquidityBakingParamsResponse> =>
  fetch(`${ROUTE3_BASE_URL}/swap-sirs${getRoute3ParametrizedUrlPart(params)}`, {
    headers: {
      Authorization: EnvVars.TEMPLE_WALLET_ROUTE3_AUTH_TOKEN
    }
  })
    .then(res => res.text())
    .then(async res => {
      const { rpcUrl, fromSymbol, toSymbol, toTokenDecimals } = params;
      const originalParams: Route3LiquidityBakingParamsResponse = parser(res);

      if (
        fromSymbol !== THREE_ROUTE_SIRS_TOKEN.symbol ||
        toSymbol === THREE_ROUTE_TEZ_TOKEN.symbol ||
        originalParams.output === undefined
      ) {
        return originalParams;
      }

      // SIRS -> not XTZ swaps are likely to fail with tez.subtraction_underflow error, preventing it
      try {
        const lbSubsidyCausedXtzDeviation = await getLbSubsidyCausedXtzDeviation(rpcUrl);
        const initialXtzInput = new BigNumber(originalParams.xtzHops[0].tokenInAmount);
        const correctedXtzInput = initialXtzInput.times(1 - lbSubsidyCausedXtzDeviation).integerValue();
        const initialOutput = new BigNumber(originalParams.output);
        // The difference between inputs is usually pretty small, so we can use the following formula
        const correctedOutput = initialOutput
          .times(correctedXtzInput)
          .div(initialXtzInput)
          .decimalPlaces(toTokenDecimals, BigNumber.ROUND_FLOOR);

        return {
          ...originalParams,
          output: correctedOutput.toString(),
          xtzHops: [
            {
              ...originalParams.xtzHops[0],
              tokenInAmount: correctedXtzInput.toFixed()
            }
          ].concat(originalParams.xtzHops.slice(1))
        };
      } catch (err) {
        console.error(err);
        return originalParams;
      }
    });

export const fetchRoute3SwapParams = ({ fromSymbol, toSymbol, dexesLimit, ...restParams }: Route3SwapParamsRequest) => {
  const isLbUnderlyingTokenSwap = intersection([fromSymbol, toSymbol], ['TZBTC', 'XTZ']).length > 0;

  return [fromSymbol, toSymbol].includes(THREE_ROUTE_SIRS_TOKEN.symbol)
    ? fetchRoute3LiquidityBakingParams({
        fromSymbol,
        toSymbol,
        // XTZ <-> SIRS and TZBTC <-> SIRS swaps have either XTZ or TZBTC hops, so a total number of hops cannot exceed the limit
        xtzDexesLimit: isLbUnderlyingTokenSwap ? dexesLimit : Math.ceil(dexesLimit / 2),
        tzbtcDexesLimit: isLbUnderlyingTokenSwap ? dexesLimit : Math.floor(dexesLimit / 2),
        ...restParams
      })
    : fetchRoute3TraditionalSwapParams({ fromSymbol, toSymbol, dexesLimit, ...restParams });
};
