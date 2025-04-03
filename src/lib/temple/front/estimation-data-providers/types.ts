import BigNumber from 'bignumber.js';
import { FeeValues, FeeValuesEIP1559, FeeValuesLegacy } from 'viem';

import { SerializedEstimate } from 'lib/temple/types';
import { AccountForChain } from 'temple/accounts';
import { EvmChain, TezosChain } from 'temple/front';
import { TempleChainKind } from 'temple/types';

export interface TezosEstimationData {
  baseFee: BigNumber;
  gasFee: BigNumber;
  revealFee: BigNumber;
  estimates: SerializedEstimate[];
}

export type FeeOptionLabel = 'slow' | 'mid' | 'fast';

export interface DisplayedFeeOptions {
  slow: string;
  mid: string;
  fast: string;
}

type EvmFeeOptionType = 'legacy' | 'eip1559';

interface EvmFeeOptionsBase {
  type: EvmFeeOptionType;
  displayed: DisplayedFeeOptions;
  gasPrice: Record<FeeOptionLabel, FeeValues>;
}

interface EvmLegacyFeeOptions extends EvmFeeOptionsBase {
  type: 'legacy';
  gasPrice: Record<FeeOptionLabel, FeeValuesLegacy>;
}

interface EvmEip1559FeeOptions extends EvmFeeOptionsBase {
  type: 'eip1559';
  gasPrice: Record<FeeOptionLabel, FeeValuesEIP1559>;
}

export type EvmFeeOptions = EvmLegacyFeeOptions | EvmEip1559FeeOptions;

export type EvmReviewData<T extends object> = T & {
  account: AccountForChain<TempleChainKind.EVM>;
  network: EvmChain;
};

export type TezosReviewData<T extends object> = T & {
  account: AccountForChain<TempleChainKind.Tezos>;
  network: TezosChain;
};

export type ReviewData<T extends object> = TezosReviewData<T> | EvmReviewData<T>;

export const isEvmReviewData = <T extends object>(data: ReviewData<T>): data is EvmReviewData<T> =>
  data.network.kind === TempleChainKind.EVM;
