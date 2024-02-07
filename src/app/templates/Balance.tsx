import React, { cloneElement, memo, ReactElement, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';
import CSSTransition from 'react-transition-group/CSSTransition';

import { _useBalance } from 'lib/balances';

interface BalanceProps {
  address: string;
  children: (b: BigNumber) => ReactElement;
  assetSlug?: string;
  networkRpc?: string;
}

const Balance = memo<BalanceProps>(({ address, children, assetSlug = 'tez', networkRpc }) => {
  const { data: balance } = _useBalance(assetSlug, address, { networkRpc });
  const exist = balance !== undefined;

  return useMemo(() => {
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
  }, [children, exist, balance]);
});

export default Balance;
