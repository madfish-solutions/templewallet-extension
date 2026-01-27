import React, { FC, ReactElement } from 'react';

import BigNumber from 'bignumber.js';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
import { useTezosAssetBalance } from 'lib/balances';
import { useEvmAssetBalance } from 'lib/balances/hooks';
import { ZERO } from 'lib/utils/numbers';
import { NetworkEssentials } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

export interface BalanceProps<T extends TempleChainKind> {
  network: NetworkEssentials<T>;
  address: T extends TempleChainKind.EVM ? HexString : string;
  children: (b: BigNumber) => ReactElement;
  assetSlug?: string;
  forceFirstRefreshOnChain?: boolean;
}

const BalanceHOC = <T extends TempleChainKind>(
  useBalance: (
    slug: string,
    address: BalanceProps<T>['address'],
    network: NetworkEssentials<T>,
    forceFirstRefreshOnChain?: BalanceProps<T>['forceFirstRefreshOnChain']
  ) => { value: BigNumber | undefined },
  defaultAssetSlug: string
) => {
  const Component: FC<BalanceProps<T>> = ({
    network,
    address,
    children,
    assetSlug = defaultAssetSlug,
    forceFirstRefreshOnChain
  }) => {
    const { value: balance } = useBalance(assetSlug, address, network, forceFirstRefreshOnChain);
    const exists = balance !== undefined;

    const childNode = children(balance == null ? ZERO : balance);

    return (
      <FadeTransition trigger={exists} duration={200} hideOnExit>
        {childNode}
      </FadeTransition>
    );
  };

  return Component;
};

export const TezosBalance = BalanceHOC<TempleChainKind.Tezos>(useTezosAssetBalance, TEZ_TOKEN_SLUG);

export const EvmBalance = BalanceHOC<TempleChainKind.EVM>(useEvmAssetBalance, EVM_TOKEN_SLUG);
