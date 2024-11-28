import React, { FC, cloneElement, ReactElement } from 'react';

import BigNumber from 'bignumber.js';
import CSSTransition from 'react-transition-group/CSSTransition';

import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useTezosAssetBalance } from 'lib/balances';
import { useEvmTokenBalance } from 'lib/balances/hooks';
import { NetworkEssentials } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

export interface BalanceProps<T extends TempleChainKind> {
  network: NetworkEssentials<T>;
  address: T extends TempleChainKind.EVM ? HexString : string;
  children: (b: BigNumber) => ReactElement;
  assetSlug?: string;
}

const BalanceHOC = <T extends TempleChainKind>(
  useBalance: (
    slug: string,
    address: BalanceProps<T>['address'],
    network: NetworkEssentials<T>
  ) => { value: BigNumber | undefined },
  defaultAssetSlug: string
) => {
  const Component: FC<BalanceProps<T>> = ({ network, address, children, assetSlug = defaultAssetSlug }) => {
    const { value: balance } = useBalance(assetSlug, address, network);
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

export const TezosBalance = BalanceHOC<TempleChainKind.Tezos>(useTezosAssetBalance, 'tez');

export const EvmBalance = BalanceHOC<TempleChainKind.EVM>(useEvmTokenBalance, EVM_TOKEN_SLUG);
