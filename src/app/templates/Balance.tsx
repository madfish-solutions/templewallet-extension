import React, { cloneElement, memo, ReactElement, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';
import CSSTransition from 'react-transition-group/CSSTransition';

import { useBalance } from 'lib/balances';

type BalanceProps = {
  address: string;
  children: (b: BigNumber) => ReactElement;
  assetSlug?: string;
  networkRpc?: string;
  displayed?: boolean;
  initial?: BigNumber;
};

const Balance = memo<BalanceProps>(({ address, children, assetSlug = 'tez', networkRpc, displayed, initial }) => {
  const { data: balance } = useBalance(assetSlug, address, {
    networkRpc,
    suspense: false,
    displayed,
    initial
  });
  const exist = balance !== undefined;

  return useMemo(() => {
    const childNode = children(balance == null ? new BigNumber(0) : balance);

    return (
      <CSSTransition
        in={exist}
        timeout={200}
        classNames={{
          enter: 'opacity-0',
          enterActive: classNames('opacity-100', 'transition ease-out duration-200'),
          exit: classNames('opacity-0', 'transition ease-in duration-200')
        }}
      >
        {cloneElement(childNode, {
          className: classNames(childNode.props.className, !exist && 'invisible')
        })}
      </CSSTransition>
    );
  }, [children, exist, balance]);
});

export default Balance;
