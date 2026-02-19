import { isDefined } from '@rnw-community/shared';
import {
  ContractMethodObject,
  ContractProvider,
  OpKind,
  TezosToolkit,
  TransferParams,
  Wallet,
  WalletParamsWithKind
} from '@taquito/taquito';
import { BigNumber } from 'bignumber.js';

import { Route3Token } from 'lib/apis/route3/fetch-route3-tokens';
import {
  APP_ID,
  ATOMIC_INPUT_THRESHOLD_FOR_FEE_FROM_INPUT,
  LIQUIDITY_BAKING_PROXY_CONTRACT,
  ROUTE3_CONTRACT,
  ROUTING_FEE_RATIO,
  SWAP_CASHBACK_RATIO
} from 'lib/route3/constants';
import { isSwapHops, Route3LiquidityBakingHops, Route3SwapHops } from 'lib/route3/interfaces';
import { isRoute3GasToken } from 'lib/route3/utils/assets.utils';
import { mapToRoute3ExecuteHops } from 'lib/route3/utils/map-to-route3-hops';
import { loadContract } from 'lib/temple/contract';
import { tokensToAtoms } from 'lib/temple/helpers';

import { getTransferPermissions } from './get-transfer-permissions';
import { ZERO } from './numbers';

export const getSwapTransferParams = async (
  fromRoute3Token: Route3Token,
  toRoute3Token: Route3Token,
  inputAmountAtomic: BigNumber,
  expectedReceivedAtomic: BigNumber,
  slippageRatio: number,
  allHops: Route3LiquidityBakingHops | Route3SwapHops,
  tezos: TezosToolkit,
  accountPkh: string
) => {
  const resultParams: Array<TransferParams> = [];
  let swapMethod: ContractMethodObject<Wallet | ContractProvider>;

  const minimumReceivedAtomic = multiplyAtomicAmount(expectedReceivedAtomic, slippageRatio, BigNumber.ROUND_FLOOR);

  if (isSwapHops(allHops)) {
    const swapContract = await loadContract(tezos, ROUTE3_CONTRACT, false);
    swapMethod = swapContract.methodsObject.execute({
      token_in_id: fromRoute3Token.id,
      token_out_id: toRoute3Token.id,
      min_out: minimumReceivedAtomic,
      receiver: accountPkh,
      hops: mapToRoute3ExecuteHops(allHops.hops),
      app_id: APP_ID
    });
  } else {
    const liquidityBakingProxyContract = await loadContract(tezos, LIQUIDITY_BAKING_PROXY_CONTRACT, false);
    swapMethod = liquidityBakingProxyContract.methodsObject.swap({
      token_in_id: fromRoute3Token.id,
      token_out_id: toRoute3Token.id,
      tez_hops: mapToRoute3ExecuteHops(allHops.xtzHops),
      tzbtc_hops: mapToRoute3ExecuteHops(allHops.tzbtcHops),
      amount_in: inputAmountAtomic,
      min_out: minimumReceivedAtomic,
      receiver: accountPkh,
      app_id: APP_ID
    });
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
    isSwapHops(allHops) ? ROUTE3_CONTRACT : LIQUIDITY_BAKING_PROXY_CONTRACT,
    accountPkh,
    fromRoute3Token,
    inputAmountAtomic
  );

  resultParams.unshift(...approve);
  resultParams.push(...revoke);

  return resultParams;
};

export const calculateSidePaymentsFromInput = (inputAmount: BigNumber | undefined, forceOutputFee = false) => {
  const swapInputAtomic = (inputAmount ?? ZERO).integerValue(BigNumber.ROUND_DOWN);
  const shouldTakeFeeFromInput = !forceOutputFee && swapInputAtomic.gte(ATOMIC_INPUT_THRESHOLD_FOR_FEE_FROM_INPUT);
  const inputFeeAtomic = shouldTakeFeeFromInput
    ? multiplyAtomicAmount(swapInputAtomic, ROUTING_FEE_RATIO, BigNumber.ROUND_CEIL)
    : ZERO;
  const cashbackSwapInputAtomic = shouldTakeFeeFromInput
    ? multiplyAtomicAmount(swapInputAtomic, SWAP_CASHBACK_RATIO)
    : ZERO;
  const swapInputMinusFeeAtomic = swapInputAtomic.minus(inputFeeAtomic);

  return {
    inputFeeAtomic,
    cashbackSwapInputAtomic,
    swapInputMinusFeeAtomic
  };
};

const calculateOutputFeeAtomic = (
  inputAmount: BigNumber | undefined,
  outputAmount: BigNumber,
  forceOutputFee = false
) => {
  const swapInputAtomic = (inputAmount ?? ZERO).integerValue(BigNumber.ROUND_DOWN);

  return !forceOutputFee && swapInputAtomic.gte(ATOMIC_INPUT_THRESHOLD_FOR_FEE_FROM_INPUT)
    ? ZERO
    : multiplyAtomicAmount(outputAmount, ROUTING_FEE_RATIO, BigNumber.ROUND_CEIL);
};

export const calculateOutputAmounts = (
  inputAmount: BigNumber,
  route3OutputInTokens: string | undefined,
  outputAssetDecimals: number,
  slippageRatio: number,
  forceOutputFee = false
) => {
  const outputAtomicAmountBeforeFee = isDefined(route3OutputInTokens)
    ? tokensToAtoms(new BigNumber(route3OutputInTokens), outputAssetDecimals)
    : ZERO;
  const minOutputAtomicBeforeFee = multiplyAtomicAmount(
    outputAtomicAmountBeforeFee,
    slippageRatio,
    BigNumber.ROUND_FLOOR
  );
  const outputFeeAtomicAmount = calculateOutputFeeAtomic(inputAmount, minOutputAtomicBeforeFee, forceOutputFee);
  const expectedReceivedAtomic = outputAtomicAmountBeforeFee.minus(outputFeeAtomicAmount);
  const minimumReceivedAtomic = minOutputAtomicBeforeFee.minus(outputFeeAtomicAmount);

  return { outputAtomicAmountBeforeFee, expectedReceivedAtomic, minimumReceivedAtomic, outputFeeAtomicAmount };
};

export const multiplyAtomicAmount = (
  amount: BigNumber,
  multiplier: BigNumber.Value,
  roundMode?: BigNumber.RoundingMode
) => amount.times(multiplier).integerValue(roundMode);

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
      assetContract.methodsObject
        .transfer({ from: senderPublicKeyHash, to: routingFeeAddress, value: feeAmountAtomic })
        .toTransferParams({ mutez: true })
    ];
  }
  if (token.standard === 'fa2') {
    return [
      assetContract.methodsObject
        .transfer([
          {
            from_: senderPublicKeyHash,
            txs: [
              {
                to_: routingFeeAddress,
                token_id: token.tokenId,
                amount: feeAmountAtomic
              }
            ]
          }
        ])
        .toTransferParams({ mutez: true })
    ];
  }

  return [];
};

function is3RouteOpParam(p: WalletParamsWithKind) {
  return p.kind === OpKind.TRANSACTION && (p.to === ROUTE3_CONTRACT || p.to === LIQUIDITY_BAKING_PROXY_CONTRACT);
}

// Applies mainly to "approve" and "transfer" operations.
// Those take less than 5,000 gas on average,
// so this value is with a generous buffer.
const NON_3ROUTE_OPERATIONS_GAS_LIMIT = 15000;

export async function getParamsWithCustomGasLimitFor3RouteSwap(tezos: TezosToolkit, opParams: WalletParamsWithKind[]) {
  if (opParams.length < 2 || !opParams.some(op => is3RouteOpParam(op))) {
    return opParams;
  }

  try {
    const constants = await tezos.rpc.getConstants();

    const non3RouteOpParamsCount = opParams.filter(op => !is3RouteOpParam(op)).length;

    const gasPer3RouteOperation = Math.min(
      constants.hard_gas_limit_per_block
        .minus(non3RouteOpParamsCount * NON_3ROUTE_OPERATIONS_GAS_LIMIT)
        .div(opParams.length - non3RouteOpParamsCount)
        .integerValue(BigNumber.ROUND_DOWN)
        .toNumber(),
      constants.hard_gas_limit_per_operation.toNumber()
    );

    return opParams.map(op => ({
      ...op,
      gasLimit: is3RouteOpParam(op) ? gasPer3RouteOperation : NON_3ROUTE_OPERATIONS_GAS_LIMIT
    }));
  } catch {
    return opParams;
  }
}
