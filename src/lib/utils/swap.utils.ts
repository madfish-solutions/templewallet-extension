import { isDefined } from '@rnw-community/shared';
import { TezosToolkit, TransferParams } from '@taquito/taquito';
import { BigNumber } from 'bignumber.js';

import { getLbStorage } from 'lib/apis/route3/fetch-route3-swap-params';
import { Route3Token } from 'lib/apis/route3/fetch-route3-tokens';
import { THREE_ROUTE_SIRS_TOKEN, THREE_ROUTE_TEZ_TOKEN, THREE_ROUTE_TZBTC_TOKEN } from 'lib/assets/three-route-tokens';
import { LIQUIDITY_BAKING_DEX_ADDRESS } from 'lib/constants';
import {
  APP_ID,
  ATOMIC_INPUT_THRESHOLD_FOR_FEE_FROM_INPUT,
  ROUTE3_CONTRACT,
  ROUTING_FEE_RATIO,
  SIRS_LIQUIDITY_SLIPPAGE_RATIO,
  SWAP_CASHBACK_RATIO
} from 'lib/route3/constants';
import { isSwapHops, Route3LiquidityBakingHops, Route3SwapHops } from 'lib/route3/interfaces';
import { isRoute3GasToken } from 'lib/route3/utils/assets.utils';
import { mapToRoute3ExecuteHops } from 'lib/route3/utils/map-to-route3-hops';
import { loadContract } from 'lib/temple/contract';
import { tokensToAtoms } from 'lib/temple/helpers';

import { getTransferPermissions } from './get-transfer-permissions';
import { ONE_MINUTE_S, ZERO } from './numbers';

export const getSwapTransferParams = async (
  fromRoute3Token: Route3Token,
  toRoute3Token: Route3Token,
  inputAmountAtomic: BigNumber,
  expectedReceivedAtomic: BigNumber,
  slippageRatio: number,
  chains: Route3LiquidityBakingHops | Route3SwapHops,
  tezos: TezosToolkit,
  accountPkh: string
) => {
  const minimumReceivedAtomic = multiplyAtomicAmount(expectedReceivedAtomic, slippageRatio, BigNumber.ROUND_FLOOR);
  let burnSirsBeforeEstimateParams: TransferParams[] = [];
  let approvesBeforeEstimateParams: TransferParams[];
  let swapBeforeEstimateParams: TransferParams[];
  let revokesBeforeEstimateParams: TransferParams[];
  let mintSirsBeforeEstimateParams: TransferParams[] = [];

  const swapContract = await loadContract(tezos, ROUTE3_CONTRACT, false);
  const lbDexContract = await loadContract(tezos, LIQUIDITY_BAKING_DEX_ADDRESS, false);
  if (isSwapHops(chains)) {
    const swapMethod = swapContract.methodsObject.execute({
      token_in_id: fromRoute3Token.id,
      token_out_id: toRoute3Token.id,
      min_out: minimumReceivedAtomic,
      receiver: accountPkh,
      hops: mapToRoute3ExecuteHops(chains.hops),
      app_id: APP_ID
    });

    swapBeforeEstimateParams = [
      swapMethod.toTransferParams({
        amount: fromRoute3Token.symbol.toLowerCase() === 'xtz' ? inputAmountAtomic.toNumber() : 0,
        mutez: true
      })
    ];

    const { approve, revoke } = await getTransferPermissions(
      tezos,
      ROUTE3_CONTRACT,
      accountPkh,
      fromRoute3Token,
      inputAmountAtomic
    );
    approvesBeforeEstimateParams = approve;
    revokesBeforeEstimateParams = revoke;
  } else if (fromRoute3Token.id === THREE_ROUTE_SIRS_TOKEN.id) {
    const xtzFromBurnAmount = tokensToAtoms(chains.xtzTree.tokenInAmount, THREE_ROUTE_TEZ_TOKEN.decimals);
    const tzbtcFromBurnAmount = tokensToAtoms(chains.tzbtcTree.tokenInAmount, THREE_ROUTE_TZBTC_TOKEN.decimals);
    burnSirsBeforeEstimateParams = [
      lbDexContract.methodsObject
        .removeLiquidity({
          to: accountPkh,
          lqtBurned: inputAmountAtomic,
          minXtzWithdrawn: xtzFromBurnAmount,
          minTokensWithdrawn: tzbtcFromBurnAmount,
          deadline: Math.floor(Date.now() / 1000) + ONE_MINUTE_S
        })
        .toTransferParams()
    ];

    const { approve: approveTzbtc, revoke: revokeTzbtc } = await getTransferPermissions(
      tezos,
      ROUTE3_CONTRACT,
      accountPkh,
      THREE_ROUTE_TZBTC_TOKEN,
      tzbtcFromBurnAmount
    );
    approvesBeforeEstimateParams = approveTzbtc;
    revokesBeforeEstimateParams = revokeTzbtc;
    swapBeforeEstimateParams = [];
    const xtzSwapOut = tokensToAtoms(chains.xtzTree.tokenOutAmount, toRoute3Token.decimals);
    const tzbtcSwapOut = tokensToAtoms(chains.tzbtcTree.tokenOutAmount, toRoute3Token.decimals);
    if (chains.xtzHops.length > 0) {
      const xtzSwapMethod = swapContract.methodsObject.execute({
        token_in_id: THREE_ROUTE_TEZ_TOKEN.id,
        token_out_id: toRoute3Token.id,
        min_out: multiplyAtomicAmount(xtzSwapOut, slippageRatio, BigNumber.ROUND_FLOOR),
        receiver: accountPkh,
        hops: mapToRoute3ExecuteHops(chains.xtzHops),
        app_id: APP_ID
      });
      swapBeforeEstimateParams.push(
        xtzSwapMethod.toTransferParams({ amount: Number(chains.xtzTree.tokenInAmount), mutez: false })
      );
    }
    if (chains.tzbtcHops.length > 0) {
      const tzbtcSwapMethod = swapContract.methodsObject.execute({
        token_in_id: THREE_ROUTE_TZBTC_TOKEN.id,
        token_out_id: toRoute3Token.id,
        min_out: multiplyAtomicAmount(tzbtcSwapOut, slippageRatio, BigNumber.ROUND_FLOOR),
        receiver: accountPkh,
        hops: mapToRoute3ExecuteHops(chains.tzbtcHops),
        app_id: APP_ID
      });
      swapBeforeEstimateParams.push(tzbtcSwapMethod.toTransferParams());
    }
  } else {
    const { approve: approveInputToken, revoke: revokeInputToken } = await getTransferPermissions(
      tezos,
      ROUTE3_CONTRACT,
      accountPkh,
      fromRoute3Token,
      inputAmountAtomic
    );
    approvesBeforeEstimateParams = approveInputToken;
    revokesBeforeEstimateParams = revokeInputToken;
    swapBeforeEstimateParams = [];
    const xtzSwapOut = tokensToAtoms(chains.xtzTree.tokenOutAmount, THREE_ROUTE_TEZ_TOKEN.decimals);
    const tzbtcSwapOut = tokensToAtoms(chains.tzbtcTree.tokenOutAmount, THREE_ROUTE_TZBTC_TOKEN.decimals);
    const xtzIsSwapped = chains.xtzHops.length > 0;
    const tzbtcIsSwapped = chains.tzbtcHops.length > 0;
    const xtzSwapMinOut = xtzIsSwapped
      ? multiplyAtomicAmount(xtzSwapOut, slippageRatio, BigNumber.ROUND_FLOOR)
      : xtzSwapOut;
    const tzbtcAddLiqInput = tzbtcIsSwapped
      ? multiplyAtomicAmount(tzbtcSwapOut, slippageRatio, BigNumber.ROUND_FLOOR)
      : tzbtcSwapOut;
    if (xtzIsSwapped) {
      const xtzSwapMethod = swapContract.methodsObject.execute({
        token_in_id: fromRoute3Token.id,
        token_out_id: THREE_ROUTE_TEZ_TOKEN.id,
        min_out: xtzSwapMinOut,
        receiver: accountPkh,
        hops: mapToRoute3ExecuteHops(chains.xtzHops),
        app_id: APP_ID
      });
      swapBeforeEstimateParams.push(xtzSwapMethod.toTransferParams());
    }
    if (tzbtcIsSwapped) {
      const tzbtcSwapMethod = swapContract.methodsObject.execute({
        token_in_id: fromRoute3Token.id,
        token_out_id: THREE_ROUTE_TZBTC_TOKEN.id,
        min_out: tzbtcAddLiqInput,
        receiver: accountPkh,
        hops: mapToRoute3ExecuteHops(chains.tzbtcHops),
        app_id: APP_ID
      });
      swapBeforeEstimateParams.push(
        tzbtcSwapMethod.toTransferParams({
          amount: fromRoute3Token.id === THREE_ROUTE_TEZ_TOKEN.id ? Number(chains.tzbtcTree.tokenInAmount) : 0,
          mutez: false
        })
      );
    }

    const { approve: approveTzbtc, revoke: revokeTzbtc } = await getTransferPermissions(
      tezos,
      LIQUIDITY_BAKING_DEX_ADDRESS,
      accountPkh,
      THREE_ROUTE_TZBTC_TOKEN,
      tzbtcAddLiqInput
    );
    // Prevent extra TEZ spending
    const { xtzPool, lqtTotal } = await getLbStorage(tezos);
    const xtzAddLiqInput = BigNumber.min(
      xtzSwapMinOut,
      xtzPool
        .times(expectedReceivedAtomic)
        .div(lqtTotal)
        .div(SIRS_LIQUIDITY_SLIPPAGE_RATIO)
        .integerValue(BigNumber.ROUND_CEIL)
    );
    mintSirsBeforeEstimateParams = approveTzbtc.concat(
      lbDexContract.methodsObject
        .addLiquidity({
          owner: accountPkh,
          minLqtMinted: minimumReceivedAtomic,
          maxTokensDeposited: tzbtcAddLiqInput,
          deadline: Math.floor(Date.now() / 1000) + ONE_MINUTE_S
        })
        .toTransferParams({ amount: xtzAddLiqInput.toNumber(), mutez: true }),
      revokeTzbtc
    );
  }

  return burnSirsBeforeEstimateParams.concat(
    approvesBeforeEstimateParams,
    swapBeforeEstimateParams,
    mintSirsBeforeEstimateParams,
    revokesBeforeEstimateParams
  );
};

export const calculateSidePaymentsFromInput = (inputAmount: BigNumber | undefined) => {
  const swapInputAtomic = (inputAmount ?? ZERO).integerValue(BigNumber.ROUND_DOWN);
  const shouldTakeFeeFromInput = swapInputAtomic.gte(ATOMIC_INPUT_THRESHOLD_FOR_FEE_FROM_INPUT);
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

const calculateOutputFeeAtomic = (inputAmount: BigNumber | undefined, outputAmount: BigNumber) => {
  const swapInputAtomic = (inputAmount ?? ZERO).integerValue(BigNumber.ROUND_DOWN);

  return swapInputAtomic.gte(ATOMIC_INPUT_THRESHOLD_FOR_FEE_FROM_INPUT)
    ? ZERO
    : multiplyAtomicAmount(outputAmount, ROUTING_FEE_RATIO, BigNumber.ROUND_CEIL);
};

export const calculateOutputAmounts = (
  inputAmount: BigNumber.Value | undefined,
  inputAssetDecimals: number,
  route3OutputInTokens: string | undefined,
  outputAssetDecimals: number,
  slippageRatio: number
) => {
  const outputAtomicAmountBeforeFee = isDefined(route3OutputInTokens)
    ? tokensToAtoms(new BigNumber(route3OutputInTokens), outputAssetDecimals)
    : ZERO;
  const minOutputAtomicBeforeFee = multiplyAtomicAmount(
    outputAtomicAmountBeforeFee,
    slippageRatio,
    BigNumber.ROUND_FLOOR
  );
  const outputFeeAtomicAmount = calculateOutputFeeAtomic(
    tokensToAtoms(inputAmount ?? ZERO, inputAssetDecimals),
    minOutputAtomicBeforeFee
  );
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
