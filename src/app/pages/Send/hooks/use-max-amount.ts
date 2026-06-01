import BigNumber from 'bignumber.js';
import { formatEther } from 'viem';

import { isTezAsset, toPenny } from 'lib/assets';
import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEvmAssetBalance, useTezosAssetBalance } from 'lib/balances/hooks';
import { RECOMMENDED_ADD_TEZ_GAS_FEE, TEZ_BURN_ADDRESS, VITALIK_ADDRESS } from 'lib/constants';
import { useCategorizedTezosAssetMetadata, useTezosGasMetadata } from 'lib/metadata';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';
import { getTezosMaxAmountToken } from 'lib/utils/get-tezos-max-amount-token';
import { ZERO } from 'lib/utils/numbers';
import { AccountForChain } from 'temple/accounts';
import { EvmChain, TezosChain } from 'temple/front';
import { getTezosToolkitWithSigner } from 'temple/front/tezos';
import { TempleChainKind } from 'temple/types';

import { useEvmEstimationData } from './use-evm-estimation-data';
import { useTezosEstimationData } from './use-tezos-estimation-data';

interface MaxAmountResult {
  max: BigNumber;
  estimating: boolean;
}

interface UseEvmMaxAmountInput {
  account: AccountForChain<TempleChainKind.EVM>;
  network: EvmChain;
  assetSlug: string;
  balance: BigNumber;
  to?: HexString;
}

export const useEvmMaxAmount = ({
  account,
  network,
  assetSlug,
  balance,
  to
}: UseEvmMaxAmountInput): MaxAmountResult => {
  const accountPkh = account.address as HexString;
  const { value: ethBalance = ZERO } = useEvmAssetBalance(EVM_TOKEN_SLUG, accountPkh, network);

  const realEst = useEvmEstimationData({
    to: (to ?? VITALIK_ADDRESS) as HexString,
    assetSlug,
    accountPkh,
    network,
    balance,
    ethBalance,
    toFilled: Boolean(to)
  });

  const fallbackEst = useEvmEstimationData({
    to: VITALIK_ADDRESS,
    assetSlug,
    accountPkh,
    network,
    balance,
    ethBalance,
    toFilled: true,
    silent: true
  });

  const fee = realEst.data?.estimatedFee ?? fallbackEst.data?.estimatedFee;
  const max = !fee
    ? balance
    : isEvmNativeTokenSlug(assetSlug)
      ? BigNumber.max(balance.minus(formatEther(fee)), ZERO)
      : balance;

  return { max, estimating: to ? realEst.isValidating : fallbackEst.isValidating };
};

interface UseTezosMaxAmountInput {
  account: AccountForChain<TempleChainKind.Tezos>;
  network: TezosChain;
  assetSlug: string;
  balance: BigNumber;
  to?: string;
}

export const useTezosMaxAmount = ({
  account,
  network,
  assetSlug,
  balance,
  to
}: UseTezosMaxAmountInput): MaxAmountResult => {
  const accountPkh = account.address;
  const tezos = getTezosToolkitWithSigner(network, account.ownerAddress || accountPkh);
  const assetMetadata = useCategorizedTezosAssetMetadata(assetSlug, network.chainId);
  const tezosGasMetadata = useTezosGasMetadata(network.chainId);
  const { value: tezBalance = ZERO } = useTezosAssetBalance(TEZ_TOKEN_SLUG, accountPkh, network);

  const realEst = useTezosEstimationData({
    to: to ?? TEZ_BURN_ADDRESS,
    tezos,
    chainId: network.chainId,
    account,
    accountPkh,
    assetSlug,
    balance,
    tezBalance,
    assetMetadata: assetMetadata ?? { decimals: 0, symbol: '', name: '' },
    toFilled: Boolean(to) && Boolean(assetMetadata)
  });

  const fallbackEst = useTezosEstimationData({
    to: TEZ_BURN_ADDRESS,
    tezos,
    chainId: network.chainId,
    account,
    accountPkh,
    assetSlug,
    balance,
    tezBalance,
    assetMetadata: assetMetadata ?? { decimals: 0, symbol: '', name: '' },
    toFilled: Boolean(assetMetadata)
  });

  const baseFee = realEst.data?.baseFee ?? fallbackEst.data?.baseFee;
  const max = !(baseFee instanceof BigNumber)
    ? balance
    : isTezAsset(assetSlug)
      ? getTezosMaxAmountToken(account.type, balance, baseFee, RECOMMENDED_ADD_TEZ_GAS_FEE, toPenny(tezosGasMetadata))
      : balance;

  return { max, estimating: to ? realEst.isValidating : fallbackEst.isValidating };
};
