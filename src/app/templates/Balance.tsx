import React, { FC, cloneElement, ReactElement } from 'react';

import BigNumber from 'bignumber.js';
import CSSTransition from 'react-transition-group/CSSTransition';

import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useTezosAssetBalance } from 'lib/balances';
import { useEvmAssetBalance } from 'lib/balances/hooks';
import { EvmNetworkEssentials, TezosNetworkEssentials } from 'temple/networks';

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
        className: childNode.props.className
      })}
    </CSSTransition>
  );
};

interface EvmBalanceProps {
  network: EvmNetworkEssentials;
  address: HexString;
  children: (b: BigNumber) => ReactElement;
  assetSlug?: string;
}

export const EvmBalance: FC<EvmBalanceProps> = ({ network, address, children, assetSlug = EVM_TOKEN_SLUG }) => {
  const { value: balance } = useEvmAssetBalance(assetSlug, address, network);
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
