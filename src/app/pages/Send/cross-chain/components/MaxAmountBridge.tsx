import { FC, useEffect } from 'react';

import BigNumber from 'bignumber.js';

import { AccountForChain } from 'temple/accounts';
import { EvmChain, TezosChain } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { useEvmMaxAmount, useTezosMaxAmount } from '../../hooks/use-max-amount';

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
  const { max, estimating } = useEvmMaxAmount({ account, network, assetSlug, balance });
  useEffect(() => onChange(max), [max, onChange]);
  useEffect(() => onEstimating?.(estimating), [estimating, onEstimating]);
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
  const { max, estimating } = useTezosMaxAmount({ account, network, assetSlug, balance });
  useEffect(() => onChange(max), [max, onChange]);
  useEffect(() => onEstimating?.(estimating), [estimating, onEstimating]);
  return null;
};
