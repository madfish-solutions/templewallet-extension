import React from 'react';

import { ReactComponent as ArbitrumIcon } from 'app/icons/networks/arbitrum.svg';
import { ReactComponent as AvalancheIcon } from 'app/icons/networks/avalanche.svg';
import { ReactComponent as BaseIcon } from 'app/icons/networks/base.svg';
import { ReactComponent as BscIcon } from 'app/icons/networks/bsc.svg';
import { ReactComponent as EthereumIcon } from 'app/icons/networks/ethereum.svg';
import { ReactComponent as OptimismIcon } from 'app/icons/networks/optimism.svg';
import { ReactComponent as PolygonIcon } from 'app/icons/networks/polygon.svg';
import { ReactComponent as RootstockIcon } from 'app/icons/networks/rootstock.svg';
import { ReactComponent as TezosIcon } from 'app/icons/networks/tezos.svg';
import { COMMON_MAINNET_CHAIN_IDS, ETHEREUM_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { TempleChainKind } from 'temple/types';

type IconComponent = typeof EthereumIcon;

const EVM_ICONS: Record<number, IconComponent> = {
  [ETHEREUM_MAINNET_CHAIN_ID]: EthereumIcon,
  [COMMON_MAINNET_CHAIN_IDS.bsc]: BscIcon,
  [COMMON_MAINNET_CHAIN_IDS.polygon]: PolygonIcon,
  [COMMON_MAINNET_CHAIN_IDS.optimism]: OptimismIcon,
  [COMMON_MAINNET_CHAIN_IDS.base]: BaseIcon,
  [COMMON_MAINNET_CHAIN_IDS.avalanche]: AvalancheIcon,
  [COMMON_MAINNET_CHAIN_IDS.arbitrum]: ArbitrumIcon,
  [COMMON_MAINNET_CHAIN_IDS.rootstock]: RootstockIcon
};

interface ChainBadgeProps {
  chainKind: TempleChainKind;
  chainId: string;
  className?: string;
}

export const ChainBadge = ({ chainKind, chainId, className }: ChainBadgeProps) => {
  const Icon = chainKind === TempleChainKind.Tezos ? TezosIcon : EVM_ICONS[Number(chainId)];
  if (!Icon) return null;

  return <Icon className={className} />;
};
