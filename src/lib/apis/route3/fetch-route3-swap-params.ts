import type { TezosToolkit } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import { intersection, transform } from 'lodash';

import { THREE_ROUTE_SIRS_TOKEN, THREE_ROUTE_TEZ_TOKEN, THREE_ROUTE_TZBTC_TOKEN } from 'lib/assets/three-route-tokens';
import { LIQUIDITY_BAKING_DEX_ADDRESS } from 'lib/constants';
import { EnvVars } from 'lib/env';
import { SIRS_LIQUIDITY_SLIPPAGE_RATIO } from 'lib/route3/constants';
import {
  Route3EmptyTreeNode,
  Route3LbSwapParamsRequest,
  Route3LiquidityBakingParamsResponse,
  Route3SwapParamsRequest,
  Route3TraditionalSwapParamsResponse,
  Route3TreeNodeType
} from 'lib/route3/interfaces';
import { loadContract } from 'lib/temple/contract';
import { atomsToTokens, tokensToAtoms } from 'lib/temple/helpers';
import { getReadOnlyTezos } from 'temple/tezos';

import { ROUTE3_BASE_URL } from './route3.api';

const parser = (origJSON: string): ReturnType<(typeof JSON)['parse']> => {
  const stringedJSON = origJSON.replace(/(input|output|tokenInAmount|tokenOutAmount)":\s*([-+Ee0-9.]+)/g, '$1":"$2"');

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

export const getLbStorage = async (tezosOrRpc: string | TezosToolkit) => {
  const tezos = typeof tezosOrRpc === 'string' ? getReadOnlyTezos(tezosOrRpc) : tezosOrRpc;
  const contract = await loadContract(tezos, LIQUIDITY_BAKING_DEX_ADDRESS, false);

  return contract.storage<{ tokenPool: BigNumber; xtzPool: BigNumber; lqtTotal: BigNumber }>();
};

const makeEmptyTreeNode = (
  tokenInId: number,
  tokenOutId: number,
  tokenInAmount: string,
  tokenOutAmount: string
): Route3EmptyTreeNode => ({
  type: Route3TreeNodeType.Empty,
  items: [],
  dexId: null,
  tokenInId,
  tokenOutId,
  tokenInAmount,
  tokenOutAmount,
  width: 0,
  height: 0
});

const fetchRoute3LiquidityBakingParams = async (
  params: Route3LbSwapParamsRequest
): Promise<Route3LiquidityBakingParamsResponse> => {
  const { rpcUrl, toSymbol, toTokenDecimals } = params;

  if (params.fromSymbol === THREE_ROUTE_SIRS_TOKEN.symbol) {
    const { tokenPool, xtzPool, lqtTotal } = await getLbStorage(params.rpcUrl);
    const sirsAtomicAmount = tokensToAtoms(params.amount, THREE_ROUTE_SIRS_TOKEN.decimals);
    const tzbtcAtomicAmount = sirsAtomicAmount
      .times(tokenPool)
      .times(SIRS_LIQUIDITY_SLIPPAGE_RATIO)
      .dividedToIntegerBy(lqtTotal);
    const xtzAtomicAmount = sirsAtomicAmount
      .times(xtzPool)
      .times(SIRS_LIQUIDITY_SLIPPAGE_RATIO)
      .dividedToIntegerBy(lqtTotal);
    const xtzInAmount = atomsToTokens(xtzAtomicAmount, THREE_ROUTE_TEZ_TOKEN.decimals).toFixed();
    const tzbtcInAmount = atomsToTokens(tzbtcAtomicAmount, THREE_ROUTE_TZBTC_TOKEN.decimals).toFixed();
    const [fromXtzSwapParams, fromTzbtcSwapParams] = await Promise.all<Route3TraditionalSwapParamsResponse>([
      toSymbol === THREE_ROUTE_TEZ_TOKEN.symbol
        ? {
            input: xtzInAmount,
            output: xtzInAmount,
            hops: [],
            tree: makeEmptyTreeNode(THREE_ROUTE_TEZ_TOKEN.id, THREE_ROUTE_TEZ_TOKEN.id, xtzInAmount, xtzInAmount)
          }
        : fetchRoute3TraditionalSwapParams({
            fromSymbol: THREE_ROUTE_TEZ_TOKEN.symbol,
            toSymbol: toSymbol,
            amount: xtzInAmount,
            toTokenDecimals,
            rpcUrl,
            dexesLimit: params.xtzDexesLimit,
            showTree: true
          }),
      toSymbol === THREE_ROUTE_TZBTC_TOKEN.symbol
        ? {
            input: tzbtcInAmount,
            output: tzbtcInAmount,
            hops: [],
            tree: makeEmptyTreeNode(
              THREE_ROUTE_TZBTC_TOKEN.id,
              THREE_ROUTE_TZBTC_TOKEN.id,
              tzbtcInAmount,
              tzbtcInAmount
            )
          }
        : fetchRoute3TraditionalSwapParams({
            fromSymbol: THREE_ROUTE_TZBTC_TOKEN.symbol,
            toSymbol: toSymbol,
            amount: tzbtcInAmount,
            toTokenDecimals,
            rpcUrl,
            dexesLimit: params.tzbtcDexesLimit,
            showTree: true
          })
    ]);

    if (fromTzbtcSwapParams.output === undefined || fromXtzSwapParams.output === undefined) {
      return {
        input: params.amount,
        output: undefined,
        tzbtcHops: [],
        xtzHops: [],
        tzbtcTree: makeEmptyTreeNode(THREE_ROUTE_TZBTC_TOKEN.id, -1, tzbtcInAmount, '0'),
        xtzTree: makeEmptyTreeNode(THREE_ROUTE_TEZ_TOKEN.id, -1, xtzInAmount, '0')
      };
    }

    return {
      input: params.amount,
      output: new BigNumber(fromTzbtcSwapParams.output).plus(fromXtzSwapParams.output).toFixed(),
      tzbtcHops: fromTzbtcSwapParams.hops,
      xtzHops: fromXtzSwapParams.hops,
      tzbtcTree: fromTzbtcSwapParams.tree,
      xtzTree: fromXtzSwapParams.tree
    };
  }

  const originalResponse = await fetch(`${ROUTE3_BASE_URL}/swap-sirs${getRoute3ParametrizedUrlPart(params)}`, {
    headers: {
      Authorization: EnvVars.TEMPLE_WALLET_ROUTE3_AUTH_TOKEN
    }
  });

  return parser(await originalResponse.text());
};

export const fetchRoute3SwapParams = ({
  fromSymbol,
  toSymbol,
  dexesLimit,
  ...restParams
}: Omit<Route3SwapParamsRequest, 'showTree'>) => {
  const isLbUnderlyingTokenSwap = intersection([fromSymbol, toSymbol], ['TZBTC', 'XTZ']).length > 0;

  return [fromSymbol, toSymbol].includes(THREE_ROUTE_SIRS_TOKEN.symbol)
    ? fetchRoute3LiquidityBakingParams({
        fromSymbol,
        toSymbol,
        // XTZ <-> SIRS and TZBTC <-> SIRS swaps have either XTZ or TZBTC hops, so a total number of hops cannot exceed the limit
        xtzDexesLimit: isLbUnderlyingTokenSwap ? dexesLimit : Math.ceil(dexesLimit / 2),
        tzbtcDexesLimit: isLbUnderlyingTokenSwap ? dexesLimit : Math.floor(dexesLimit / 2),
        showTree: true,
        ...restParams
      })
    : fetchRoute3TraditionalSwapParams({ fromSymbol, toSymbol, dexesLimit, showTree: true, ...restParams });
};
