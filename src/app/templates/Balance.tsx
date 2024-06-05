import React, { FC, cloneElement, ReactElement } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';
import CSSTransition from 'react-transition-group/CSSTransition';

import { useTezosAssetBalance } from 'lib/balances';
import { useEvmTokenBalance } from 'lib/balances/hooks';
import { TezosNetworkEssentials } from 'temple/networks';

interface TezosBalanceProps {
  network: TezosNetworkEssentials;
  address: string;
  children: (b: BigNumber) => ReactElement;
  assetSlug?: string;
}
export const TezosBalance: FC<TezosBalanceProps> = ({ network, address, children, assetSlug = 'tez' }) => {
  const { value: balance } = useTezosAssetBalance(assetSlug, address, network);
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
        className: clsx(childNode.props.className, !exists && 'invisible')
      })}
    </CSSTransition>
  );
};

interface EvmBalanceProps {
  chainId: number;
  address: HexString;
  children: (b: BigNumber) => ReactElement;
  assetSlug?: string;
}
export const EvmBalance: FC<EvmBalanceProps> = ({ chainId, address, children, assetSlug = 'eth' }) => {
  const { value: balance } = useEvmTokenBalance(assetSlug, address, chainId);
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
        className: clsx(childNode.props.className, !exists && 'invisible')
      })}
    </CSSTransition>
  );
};
