import { ContractMethod, ContractProvider, TezosToolkit, TransferParams, Wallet } from '@taquito/taquito';
import { BigNumber } from 'bignumber.js';

import { Route3Token } from 'lib/apis/route3/fetch-route3-tokens';
import { TZBTC_TOKEN_METADATA } from 'lib/assets/known-tokens';
import { THREE_ROUTE_SIRS_TOKEN } from 'lib/assets/three-route-tokens';
import { TEZOS_METADATA } from 'lib/metadata';
import {
  APP_ID,
  ATOMIC_INPUT_THRESHOLD_FOR_FEE_FROM_INPUT,
  LIQUIDITY_BAKING_PROXY_CONTRACT,
  ROUTE3_CONTRACT,
  ROUTING_FEE_RATIO
} from 'lib/route3/constants';
import { isSwapChains, Route3LiquidityBakingChains, Route3SwapChains } from 'lib/route3/interfaces';
import { isRoute3GasToken } from 'lib/route3/utils/assets.utils';
import { mapToRoute3ExecuteHops } from 'lib/route3/utils/map-to-route3-hops';
import { loadContract } from 'lib/temple/contract';

import { getTransferPermissions } from './get-transfer-permissions';
import { ZERO } from './numbers';

export const getSwapTransferParams = async (
  fromRoute3Token: Route3Token,
  toRoute3Token: Route3Token,
  inputAmountAtomic: BigNumber,
  minimumReceivedAtomic: BigNumber,
  chains: Route3SwapChains | Route3LiquidityBakingChains,
  tezos: TezosToolkit,
  accountPkh: string
) => {
  const resultParams: Array<TransferParams> = [];
  let swapMethod: ContractMethod<Wallet | ContractProvider>;

  if (isSwapChains(chains)) {
    const swapContract = await loadContract(tezos, ROUTE3_CONTRACT, false);
    swapMethod = swapContract.methods.execute(
      fromRoute3Token.id,
      toRoute3Token.id,
      minimumReceivedAtomic,
      accountPkh,
      mapToRoute3ExecuteHops(chains.chains, fromRoute3Token.decimals),
      APP_ID
    );
  } else {
    const liquidityBakingProxyContract = await loadContract(tezos, LIQUIDITY_BAKING_PROXY_CONTRACT, false);
    const isDivestingFromLb = fromRoute3Token.symbol === THREE_ROUTE_SIRS_TOKEN.symbol;
    swapMethod = liquidityBakingProxyContract.methods.swap(
      fromRoute3Token.id,
      toRoute3Token.id,
      mapToRoute3ExecuteHops(
        chains.xtzChain.chains,
        isDivestingFromLb ? TEZOS_METADATA.decimals : fromRoute3Token.decimals
      ),
      mapToRoute3ExecuteHops(
        chains.tzbtcChain.chains,
        isDivestingFromLb ? TZBTC_TOKEN_METADATA.decimals : fromRoute3Token.decimals
      ),
      inputAmountAtomic,
      minimumReceivedAtomic,
      accountPkh,
      APP_ID
    );
  }

  if (fromRoute3Token.symbol.toLowerCase() === 'xtz') {
    resultParams.push(
      swapMethod.toTransferParams({
        amount: inputAmountAtomic.toNumber(),
        mutez: true
      })
    );
  } else {
    resultParams.push(swapMethod.toTransferParams());
  }

  const { approve, revoke } = await getTransferPermissions(
    tezos,
    isSwapChains(chains) ? ROUTE3_CONTRACT : LIQUIDITY_BAKING_PROXY_CONTRACT,
    accountPkh,
    fromRoute3Token,
    inputAmountAtomic
  );

  resultParams.unshift(...approve);
  resultParams.push(...revoke);

  return resultParams;
};

export const calculateRoutingInputAndFeeFromInput = (inputAmount: BigNumber | undefined) => {
  const swapInputAtomic = (inputAmount ?? ZERO).integerValue(BigNumber.ROUND_DOWN);
  const shouldTakeFeeFromInput = swapInputAtomic.gte(ATOMIC_INPUT_THRESHOLD_FOR_FEE_FROM_INPUT);
  const swapInputMinusFeeAtomic = shouldTakeFeeFromInput
    ? swapInputAtomic.times(ROUTING_FEE_RATIO).integerValue(BigNumber.ROUND_DOWN)
    : swapInputAtomic;
  const routingFeeFromInputAtomic = swapInputAtomic.minus(swapInputMinusFeeAtomic);

  return {
    swapInputMinusFeeAtomic,
    routingFeeFromInputAtomic
  };
};

export const calculateFeeFromOutput = (inputAmount: BigNumber | undefined, outputAmount: BigNumber) =>
  (inputAmount ?? ZERO).gte(ATOMIC_INPUT_THRESHOLD_FOR_FEE_FROM_INPUT)
    ? ZERO
    : outputAmount.times(1 - ROUTING_FEE_RATIO).integerValue(BigNumber.ROUND_UP);

export const getRoutingFeeTransferParams = async (
  token: Route3Token,
  feeAmountAtomic: BigNumber,
  senderPublicKeyHash: string,
  routingFeeAddress: string,
  tezos: TezosToolkit
) => {
  if (feeAmountAtomic.lte(ZERO)) {
    return [];
  }

  if (isRoute3GasToken(token.contract)) {
    return [
      {
        amount: feeAmountAtomic.toNumber(),
        to: routingFeeAddress,
        mutez: true
      }
    ];
  }

  const assetContract = await tezos.wallet.at(token.contract);

  if (token.standard === 'fa12') {
    return [
      assetContract.methods
        .transfer(senderPublicKeyHash, routingFeeAddress, feeAmountAtomic.toNumber())
        .toTransferParams({ mutez: true })
    ];
  }
  if (token.standard === 'fa2') {
    return [
      assetContract.methods
        .transfer([
          {
            from_: senderPublicKeyHash,
            txs: [
              {
                to_: routingFeeAddress,
                token_id: token.tokenId,
                amount: feeAmountAtomic.toNumber()
              }
            ]
          }
        ])
        .toTransferParams({ mutez: true })
    ];
  }

  return [];
};
