import React, { FC, useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { useTypedSWR } from 'lib/swr';
import { useAccountAddressForEvm, useEthereumMainnetChain } from 'temple/front';

import { makeEthereumToolkit } from '../../EarnEth/utils';
import { ETH_SAVING_OFFER } from '../config';
import { ActiveDeposit } from '../types';

import { EarnItem } from './EarnItem';

export const EthSavingItem: FC = () => {
  const evmAddress = useAccountAddressForEvm();

  if (evmAddress) {
    return <DepositContent evmAddress={evmAddress} />;
  }

  return null;
};

interface DepositContentProps {
  evmAddress: string;
}

const DepositContent: FC<DepositContentProps> = ({ evmAddress }) => {
  const network = useEthereumMainnetChain();

  const getStats = useCallback(
    () => makeEthereumToolkit(network).contractViewsStats(evmAddress),
    [network, evmAddress]
  );

  const { data: stats, isLoading } = useTypedSWR(['eth-staking-balances-item', evmAddress, network.chainId], getStats, {
    revalidateOnFocus: false
  });

  const deposit = useMemo<ActiveDeposit | undefined>(() => {
    if (isLoading) return { isLoading: true };
    if (!stats) return;

    const {
      pendingBalanceOf,
      depositedBalanceOf,
      restakedRewardOf,
      pendingRestakedRewardOf,
      pendingDepositedBalanceOf
    } = stats;

    const pendingStaked = BigNumber.sum(pendingBalanceOf, pendingDepositedBalanceOf, pendingRestakedRewardOf);
    const amount = BigNumber.sum(depositedBalanceOf, restakedRewardOf).plus(pendingStaked);

    if (amount.lte(0)) return;

    return { amount, isLoading };
  }, [stats, isLoading]);

  return <EarnItem offer={ETH_SAVING_OFFER} deposit={deposit} />;
};
