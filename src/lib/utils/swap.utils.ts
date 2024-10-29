import { ContractMethodObject, ContractProvider, OpKind, TezosToolkit, TransferParams, Wallet } from '@taquito/taquito';
import { BigNumber } from 'bignumber.js';

import { Route3Token } from 'lib/apis/route3/fetch-route3-tokens';
import { FEE_PER_GAS_UNIT } from 'lib/constants';
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

import { getTransferPermissions } from './get-transfer-permissions';
import { ZERO } from './numbers';

const GAS_CAP_PER_INTERNAL_OPERATION = 1000;

const isSwapTransaction = (params: TransferParams) =>
  params.to === ROUTE3_CONTRACT || params.to === LIQUIDITY_BAKING_PROXY_CONTRACT;

/**
 * Estimates a batch of transfers and applies the estimations to the transfer params. If the estimation fails,
 * the transfer params are returned as is.
 * @param transfersParams The transfer params to estimate and apply the estimations to.
 * @param tezos The TezosToolkit instance to use for the estimations.
 * @param sourcePkh The public key hash of the sender.
 * @param gasCap A function that returns the gas cap for a given transfer params.
 */
const withBatchEstimations = async (
  transfersParams: TransferParams[],
  tezos: TezosToolkit,
  sourcePkh: string,
  gasCap: (params: TransferParams) => number = () => GAS_CAP_PER_INTERNAL_OPERATION
) => {
  if (transfersParams.length === 0) {
    return [];
  }

  try {
    const estimations = await tezos.estimate.batch(
      transfersParams.map(params => ({ kind: OpKind.TRANSACTION, source: sourcePkh, ...params }))
    );

    return transfersParams.map((params, index) => {
      const { suggestedFeeMutez, storageLimit, gasLimit } = estimations[index];

      return {
        ...params,
        fee: suggestedFeeMutez + Math.ceil(gasCap(params) * FEE_PER_GAS_UNIT),
        storageLimit,
        gasLimit: gasLimit + gasCap(params)
      };
    });
  } catch (e) {
    console.error(e);

    return transfersParams;
  }
};

export const getSwapTransferParams = async (
  fromRoute3Token: Route3Token,
  toRoute3Token: Route3Token,
  inputAmountAtomic: BigNumber,
  minimumReceivedAtomic: BigNumber,
  chains: Route3LiquidityBakingHops | Route3SwapHops,
  tezos: TezosToolkit,
  accountPkh: string
) => {
  const swapParams: Array<TransferParams> = [];
  let swapMethod: ContractMethodObject<Wallet | ContractProvider>;

  if (isSwapHops(chains)) {
    const swapContract = await loadContract(tezos, ROUTE3_CONTRACT, false);
    swapMethod = swapContract.methodsObject.execute({
      token_in_id: fromRoute3Token.id,
      token_out_id: toRoute3Token.id,
      min_out: minimumReceivedAtomic,
      receiver: accountPkh,
      hops: mapToRoute3ExecuteHops(chains.hops),
      app_id: APP_ID
    });
  } else {
    const liquidityBakingProxyContract = await loadContract(tezos, LIQUIDITY_BAKING_PROXY_CONTRACT, false);
    swapMethod = liquidityBakingProxyContract.methodsObject.swap({
      token_in_id: fromRoute3Token.id,
      token_out_id: toRoute3Token.id,
      tez_hops: mapToRoute3ExecuteHops(chains.xtzHops),
      tzbtc_hops: mapToRoute3ExecuteHops(chains.tzbtcHops),
      amount_in: inputAmountAtomic,
      min_out: minimumReceivedAtomic,
      receiver: accountPkh,
      app_id: APP_ID
    });
  }

  if (fromRoute3Token.symbol.toLowerCase() === 'xtz') {
    swapParams.push(
      swapMethod.toTransferParams({
        amount: inputAmountAtomic.toNumber(),
        mutez: true
      })
    );
  } else {
    swapParams.push(swapMethod.toTransferParams());
  }

  const { approve, revoke } = await getTransferPermissions(
    tezos,
    isSwapHops(chains) ? ROUTE3_CONTRACT : LIQUIDITY_BAKING_PROXY_CONTRACT,
    accountPkh,
    fromRoute3Token,
    inputAmountAtomic
  );

  const [swapWithApproveParams, revokeParams] = await Promise.all([
    withBatchEstimations(approve.concat(swapParams), tezos, accountPkh, params => {
      const approximateInternalOperationsCount = isSwapTransaction(params)
        ? isSwapHops(chains)
          ? 1 + chains.hops.length
          : 2 + chains.xtzHops.length + chains.tzbtcHops.length
        : 1;

      return approximateInternalOperationsCount * GAS_CAP_PER_INTERNAL_OPERATION;
    }),
    withBatchEstimations(revoke, tezos, accountPkh)
  ]);

  return swapWithApproveParams.concat(revokeParams);
};

export const calculateSidePaymentsFromInput = (inputAmount: BigNumber | undefined) => {
  const swapInputAtomic = (inputAmount ?? ZERO).integerValue(BigNumber.ROUND_DOWN);
  const shouldTakeFeeFromInput = swapInputAtomic.gte(ATOMIC_INPUT_THRESHOLD_FOR_FEE_FROM_INPUT);
  const inputFeeAtomic = shouldTakeFeeFromInput
    ? swapInputAtomic.times(ROUTING_FEE_RATIO).integerValue(BigNumber.ROUND_CEIL)
    : ZERO;
  const cashbackSwapInputAtomic = shouldTakeFeeFromInput
    ? swapInputAtomic.times(SWAP_CASHBACK_RATIO).integerValue()
    : ZERO;
  const swapInputMinusFeeAtomic = swapInputAtomic.minus(inputFeeAtomic);

  return {
    inputFeeAtomic,
    cashbackSwapInputAtomic,
    swapInputMinusFeeAtomic
  };
};

export const calculateOutputFeeAtomic = (inputAmount: BigNumber | undefined, outputAmount: BigNumber) => {
  const swapInputAtomic = (inputAmount ?? ZERO).integerValue(BigNumber.ROUND_DOWN);

  return swapInputAtomic.gte(ATOMIC_INPUT_THRESHOLD_FOR_FEE_FROM_INPUT)
    ? ZERO
    : outputAmount.times(ROUTING_FEE_RATIO).integerValue(BigNumber.ROUND_CEIL);
};

const getRoutingFeeTransferParamsBeforeEstimate = async (
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

export const getRoutingFeeTransferParams = async (
  token: Route3Token,
  feeAmountAtomic: BigNumber,
  senderPublicKeyHash: string,
  routingFeeAddress: string,
  tezos: TezosToolkit
) =>
  withBatchEstimations(
    await getRoutingFeeTransferParamsBeforeEstimate(
      token,
      feeAmountAtomic,
      senderPublicKeyHash,
      routingFeeAddress,
      tezos
    ),
    tezos,
    senderPublicKeyHash
  );
