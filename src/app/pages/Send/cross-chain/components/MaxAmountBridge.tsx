import { FC, useEffect } from 'react';

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

import { useEvmEstimationData } from '../../hooks/use-evm-estimation-data';
import { useTezosEstimationData } from '../../hooks/use-tezos-estimation-data';

interface CommonBridgeProps {
  balance: BigNumber;
  onChange: (max: BigNumber) => void;
  onEstimating?: (estimating: boolean) => void;
}

interface EvmMaxAmountBridgeProps extends CommonBridgeProps {
  account: AccountForChain<TempleChainKind.EVM>;
  network: EvmChain;
  assetSlug: string;
}

export const EvmMaxAmountBridge: FC<EvmMaxAmountBridgeProps> = ({
  account,
  network,
  assetSlug,
  balance,
  onChange,
  onEstimating
}) => {
  const accountPkh = account.address as HexString;
  const { value: ethBalance = ZERO } = useEvmAssetBalance(EVM_TOKEN_SLUG, accountPkh, network);

  const { data, isValidating } = useEvmEstimationData({
    to: VITALIK_ADDRESS,
    assetSlug,
    accountPkh,
    network,
    balance,
    ethBalance,
    toFilled: true,
    silent: true
  });

  useEffect(() => onEstimating?.(isValidating), [isValidating, onEstimating]);

  useEffect(() => {
    const fee = data?.estimatedFee;
    if (!fee) {
      onChange(balance);
      return;
    }
    const max = isEvmNativeTokenSlug(assetSlug) ? BigNumber.max(balance.minus(formatEther(fee)), ZERO) : balance;
    onChange(max);
  }, [data, assetSlug, balance, onChange]);

  return null;
};

interface TezosMaxAmountBridgeProps extends CommonBridgeProps {
  account: AccountForChain<TempleChainKind.Tezos>;
  network: TezosChain;
  assetSlug: string;
}

export const TezosMaxAmountBridge: FC<TezosMaxAmountBridgeProps> = ({
  account,
  network,
  assetSlug,
  balance,
  onChange,
  onEstimating
}) => {
  const accountPkh = account.address;
  const tezos = getTezosToolkitWithSigner(network, account.ownerAddress || accountPkh);
  const assetMetadata = useCategorizedTezosAssetMetadata(assetSlug, network.chainId);
  const tezosGasMetadata = useTezosGasMetadata(network.chainId);

  const { value: tezBalance = ZERO } = useTezosAssetBalance(TEZ_TOKEN_SLUG, accountPkh, network);

  const { data, isValidating } = useTezosEstimationData({
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

  useEffect(() => onEstimating?.(isValidating), [isValidating, onEstimating]);

  useEffect(() => {
    const baseFee = data?.baseFee;
    if (!(baseFee instanceof BigNumber)) {
      onChange(balance);
      return;
    }
    const max = isTezAsset(assetSlug)
      ? getTezosMaxAmountToken(account.type, balance, baseFee, RECOMMENDED_ADD_TEZ_GAS_FEE, toPenny(tezosGasMetadata))
      : balance;
    onChange(max);
  }, [data, assetSlug, balance, account.type, tezosGasMetadata, onChange]);

  return null;
};
