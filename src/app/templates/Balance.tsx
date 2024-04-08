import React, { FC, cloneElement, ReactElement } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';
import CSSTransition from 'react-transition-group/CSSTransition';

import { useBalance } from 'lib/balances';
import { TezosNetworkEssentials } from 'temple/networks';

interface Props {
  network: TezosNetworkEssentials;
  address: string;
  children: (b: BigNumber) => ReactElement;
  assetSlug?: string;
}

/** TezosBalance */
const Balance: FC<Props> = ({ network, address, children, assetSlug = 'tez' }) => {
  const { value: balance } = useBalance(assetSlug, address, network);
  const exist = balance !== undefined;

  const childNode = children(balance == null ? new BigNumber(0) : balance);

  return (
    <CSSTransition
      in={exist}
      timeout={200}
      classNames={{
        enter: 'opacity-0',
        enterActive: 'opacity-100 transition ease-out duration-200',
        exit: 'opacity-0 transition ease-in duration-200'
      }}
    >
      {cloneElement(childNode, {
        className: clsx(childNode.props.className, !exist && 'invisible')
      })}
    </CSSTransition>
  );
};

export default Balance;
