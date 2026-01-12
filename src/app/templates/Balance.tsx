import React, { FC, cloneElement, ReactElement } from 'react';

import BigNumber from 'bignumber.js';
import CSSTransitionBase from 'react-transition-group/CSSTransition';

import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
import { useTezosAssetBalance } from 'lib/balances';
import { useEvmAssetBalance } from 'lib/balances/hooks';
import { NetworkEssentials } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

export interface BalanceProps<T extends TempleChainKind> {
  network: NetworkEssentials<T>;
  address: T extends TempleChainKind.EVM ? HexString : string;
  children: (b: BigNumber) => ReactElement;
  assetSlug?: string;
  forceFirstRefreshOnChain?: boolean;
}

const CSSTransition = CSSTransitionBase as unknown as React.ComponentType<any>;

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

    const childNode = children(balance == null ? new BigNumber(0) : balance);

    return (
      <CSSTransition
        in={exists}
        timeout={200}
        classNames={{
          enter: 'opacity-0',
          enterActive: 'opacity-100 transition ease-out duration-200',
          exit: 'opacity-0 transition ease-in duration-200'
        }}
      >
        {cloneElement(childNode, {
          className: childNode.props.className
        })}
      </CSSTransition>
    );
  };

  return Component;
};

export const TezosBalance = BalanceHOC<TempleChainKind.Tezos>(useTezosAssetBalance, TEZ_TOKEN_SLUG);

export const EvmBalance = BalanceHOC<TempleChainKind.EVM>(useEvmAssetBalance, EVM_TOKEN_SLUG);
