import React, { FC, cloneElement, ReactElement } from 'react';

import { isDefined } from '@rnw-community/shared';
import BigNumber from 'bignumber.js';
import clsx from 'clsx';
import CSSTransition from 'react-transition-group/CSSTransition';

import { useEvmAccountTokenBalance } from 'app/hooks/evm/balance';
import { useEvmTokenMetadata } from 'app/hooks/evm/metadata';
import { useTezosAssetBalance } from 'lib/balances';
import { atomsToTokens } from 'lib/temple/helpers';
import { TezosNetworkEssentials } from 'temple/networks';

interface TezosBalanceProps {
  network: TezosNetworkEssentials;
  address: string;
  children: (b: BigNumber) => ReactElement;
  assetSlug?: string;
}
export const TezosBalance: FC<TezosBalanceProps> = ({ network, address, children, assetSlug = 'tez' }) => {
  const { value: balance } = useTezosAssetBalance(assetSlug, address, network);
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

interface EvmBalanceProps {
  chainId: number;
  address: HexString;
  children: (b: BigNumber) => ReactElement;
  assetSlug?: string;
}
export const EvmBalance: FC<EvmBalanceProps> = ({ chainId, address, children, assetSlug = 'tez' }) => {
  const tokenMetadata = useEvmTokenMetadata(chainId, assetSlug);
  const rawBalance = useEvmAccountTokenBalance(address, chainId, assetSlug);

  const exist = isDefined(tokenMetadata) && isDefined(rawBalance);

  const childNode = children(
    exist ? atomsToTokens(new BigNumber(rawBalance), tokenMetadata.decimals) : new BigNumber(0)
  );

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
