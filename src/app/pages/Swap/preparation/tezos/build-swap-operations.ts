import { TezosToolkit, TransferParams, WalletParamsWithKind } from '@taquito/taquito';
import BigNumber from 'bignumber.js';

import { fetchRoute3SwapParams } from 'lib/apis/route3/fetch-route3-swap-params';
import { Route3Token } from 'lib/apis/route3/fetch-route3-tokens';
import { TEZ_BURN_ADDRESS } from 'lib/constants';
import {
  ROUTING_FEE_ADDRESS,
  ROUTING_FEE_RATIO,
  ROUTING_FEE_SLIPPAGE_RATIO,
  SWAP_CASHBACK_RATIO,
  TEMPLE_TOKEN
} from 'lib/route3/constants';
import { Route3SwapParamsResponse } from 'lib/route3/interfaces';
import { atomsToTokens, tokensToAtoms } from 'lib/temple/helpers';
import { ZERO } from 'lib/utils/numbers';
import { parseTransferParamsToParamsWithKind } from 'lib/utils/parse-transfer-params';
import {
  calculateOutputAmounts,
  calculateSidePaymentsFromInput,
  getRoutingFeeTransferParams,
  getSwapTransferParams,
  multiplyAtomicAmount
} from 'lib/utils/swap.utils';

// Maximum number of DEXes allowed in a cashback swap route.
// This is used when performing an additional swap via the 3Route contract
// to obtain TKEY tokens for user cashback rewards.
const CASHBACK_SWAP_MAX_DEXES = 3;

export interface TezosSwapBuildInput {
  tezos: TezosToolkit;
  accountPkh: string;
  fromRoute3Token: Route3Token;
  toRoute3Token: Route3Token;
  swapParams: Route3SwapParamsResponse;
  inputAtomic: BigNumber;
  slippageRatio: number;
  outputDecimals: number;
  outputSymbol: string;
  isInputTokenTempleToken: boolean;
  isOutputTokenTempleToken: boolean;
  isSwapAmountMoreThreshold: boolean;
}

export interface TezosSwapOperations {
  opParams: WalletParamsWithKind[];
  cashbackInTkey?: string;
  minimumReceived: { amount: string; symbol: string };
}

export const buildTezosSwapOperations = async ({
  tezos,
  accountPkh,
  fromRoute3Token,
  toRoute3Token,
  swapParams,
  inputAtomic,
  slippageRatio,
  outputDecimals,
  outputSymbol,
  isInputTokenTempleToken,
  isOutputTokenTempleToken,
  isSwapAmountMoreThreshold
}: TezosSwapBuildInput): Promise<TezosSwapOperations | null> => {
  const {
    swapInputMinusFeeAtomic,
    inputFeeAtomic: routingFeeFromInputAtomic,
    cashbackSwapInputAtomic: cashbackSwapInputFromInAtomic
  } = calculateSidePaymentsFromInput(inputAtomic, isOutputTokenTempleToken);
  const { outputAtomicAmountBeforeFee, minimumReceivedAtomic, outputFeeAtomicAmount } = calculateOutputAmounts(
    inputAtomic,
    swapParams.output,
    outputDecimals,
    slippageRatio,
    isOutputTokenTempleToken
  );

  const allSwapParams: Array<TransferParams> = [];
  let routingOutputFeeTransferParams: TransferParams[] = await getRoutingFeeTransferParams(
    toRoute3Token,
    outputFeeAtomicAmount,
    accountPkh,
    ROUTING_FEE_ADDRESS,
    tezos
  );

  const route3SwapOpParams = await getSwapTransferParams(
    fromRoute3Token,
    toRoute3Token,
    swapInputMinusFeeAtomic,
    outputAtomicAmountBeforeFee,
    slippageRatio,
    swapParams,
    tezos,
    accountPkh
  );

  if (route3SwapOpParams.length === 0) {
    return null;
  }

  let cashback: BigNumber | undefined;

  if (isInputTokenTempleToken && isSwapAmountMoreThreshold) {
    const routingInputFeeOpParams = await getRoutingFeeTransferParams(
      fromRoute3Token,
      routingFeeFromInputAtomic.minus(cashbackSwapInputFromInAtomic),
      accountPkh,
      TEZ_BURN_ADDRESS,
      tezos
    );
    allSwapParams.push(...routingInputFeeOpParams);
  } else if (isInputTokenTempleToken && !isSwapAmountMoreThreshold) {
    const routingFeeOpParams = await getRoutingFeeTransferParams(
      TEMPLE_TOKEN,
      routingFeeFromInputAtomic,
      accountPkh,
      ROUTING_FEE_ADDRESS,
      tezos
    );
    allSwapParams.push(...routingFeeOpParams);
  } else if (
    !isInputTokenTempleToken &&
    isSwapAmountMoreThreshold &&
    routingFeeFromInputAtomic.gt(0) &&
    !isOutputTokenTempleToken
  ) {
    const swapToTempleParams = await fetchRoute3SwapParams({
      fromSymbol: fromRoute3Token.symbol,
      toSymbol: TEMPLE_TOKEN.symbol,
      toTokenDecimals: TEMPLE_TOKEN.decimals,
      amount: atomsToTokens(routingFeeFromInputAtomic, fromRoute3Token.decimals).toFixed(),
      dexesLimit: CASHBACK_SWAP_MAX_DEXES,
      rpcUrl: tezos.rpc.getRpcUrl()
    });

    const templeExpectedOutputAtomic = tokensToAtoms(
      new BigNumber(swapToTempleParams.output ?? ZERO),
      TEMPLE_TOKEN.decimals
    );
    const templeMinOutputAtomic = multiplyAtomicAmount(
      templeExpectedOutputAtomic,
      ROUTING_FEE_SLIPPAGE_RATIO,
      BigNumber.ROUND_DOWN
    );

    const swapToTempleTokenOpParams = await getSwapTransferParams(
      fromRoute3Token,
      TEMPLE_TOKEN,
      routingFeeFromInputAtomic,
      templeExpectedOutputAtomic,
      ROUTING_FEE_SLIPPAGE_RATIO,
      swapToTempleParams,
      tezos,
      accountPkh
    );

    const burnAmount = templeMinOutputAtomic
      .times(ROUTING_FEE_RATIO - SWAP_CASHBACK_RATIO)
      .dividedToIntegerBy(ROUTING_FEE_RATIO);

    cashback = templeExpectedOutputAtomic.minus(burnAmount);

    const routingFeeOpParams = await getRoutingFeeTransferParams(
      TEMPLE_TOKEN,
      burnAmount,
      accountPkh,
      TEZ_BURN_ADDRESS,
      tezos
    );

    allSwapParams.push(...swapToTempleTokenOpParams);
    allSwapParams.push(...routingFeeOpParams);
  } else if (!isInputTokenTempleToken && isSwapAmountMoreThreshold && isOutputTokenTempleToken) {
    const burnAmount = outputFeeAtomicAmount
      .times(ROUTING_FEE_RATIO - SWAP_CASHBACK_RATIO)
      .dividedToIntegerBy(ROUTING_FEE_RATIO);

    const expectedOutputFee = multiplyAtomicAmount(
      outputAtomicAmountBeforeFee,
      ROUTING_FEE_RATIO,
      BigNumber.ROUND_CEIL
    );
    cashback = expectedOutputFee.minus(burnAmount);

    routingOutputFeeTransferParams = await getRoutingFeeTransferParams(
      TEMPLE_TOKEN,
      burnAmount,
      accountPkh,
      TEZ_BURN_ADDRESS,
      tezos
    );
  } else if (!isInputTokenTempleToken && isSwapAmountMoreThreshold) {
    const swapToTempleParams = await fetchRoute3SwapParams({
      fromSymbol: toRoute3Token.symbol,
      toSymbol: TEMPLE_TOKEN.symbol,
      toTokenDecimals: TEMPLE_TOKEN.decimals,
      amount: atomsToTokens(outputFeeAtomicAmount, toRoute3Token.decimals).toFixed(),
      dexesLimit: CASHBACK_SWAP_MAX_DEXES,
      rpcUrl: tezos.rpc.getRpcUrl()
    });

    const templeExpectedOutputAtomic = tokensToAtoms(
      new BigNumber(swapToTempleParams.output ?? ZERO),
      TEMPLE_TOKEN.decimals
    );
    const templeMinOutputAtomic = multiplyAtomicAmount(
      templeExpectedOutputAtomic,
      ROUTING_FEE_SLIPPAGE_RATIO,
      BigNumber.ROUND_DOWN
    );

    const swapToTempleTokenOpParams = await getSwapTransferParams(
      toRoute3Token,
      TEMPLE_TOKEN,
      outputFeeAtomicAmount,
      templeExpectedOutputAtomic,
      ROUTING_FEE_SLIPPAGE_RATIO,
      swapToTempleParams,
      tezos,
      accountPkh
    );

    const burnAmount = templeMinOutputAtomic
      .times(ROUTING_FEE_RATIO - SWAP_CASHBACK_RATIO)
      .dividedToIntegerBy(ROUTING_FEE_RATIO);

    cashback = templeExpectedOutputAtomic.minus(burnAmount);

    const routingFeeOpParams = await getRoutingFeeTransferParams(
      TEMPLE_TOKEN,
      burnAmount,
      accountPkh,
      TEZ_BURN_ADDRESS,
      tezos
    );
    routingOutputFeeTransferParams = [...swapToTempleTokenOpParams, ...routingFeeOpParams];
  } else if (!isInputTokenTempleToken && !isSwapAmountMoreThreshold) {
    const routingInputFeeOpParams = await getRoutingFeeTransferParams(
      fromRoute3Token,
      routingFeeFromInputAtomic,
      accountPkh,
      ROUTING_FEE_ADDRESS,
      tezos
    );
    allSwapParams.push(...routingInputFeeOpParams);
  }

  allSwapParams.push(...route3SwapOpParams, ...routingOutputFeeTransferParams);

  return {
    opParams: allSwapParams.map(param => parseTransferParamsToParamsWithKind(param)),
    cashbackInTkey: cashback ? atomsToTokens(new BigNumber(cashback), TEMPLE_TOKEN.decimals).toString() : undefined,
    minimumReceived: {
      amount: atomsToTokens(new BigNumber(minimumReceivedAtomic), outputDecimals).toString(),
      symbol: outputSymbol
    }
  };
};
