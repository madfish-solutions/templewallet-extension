import React, { FC, useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { useTypedSWR } from 'lib/swr';
import { ETHEREUM_HOODI_CHAIN_ID, ETHEREUM_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useAccountAddressForEvm, useAllEvmChains } from 'temple/front';

import { makeEthereumToolkit } from '../../EarnEth/utils';
import { getEthSavingOffer } from '../config';
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
  const isTestnet = useTestnetModeEnabledSelector();
  const allEvmChains = useAllEvmChains();
  const chainId = isTestnet ? ETHEREUM_HOODI_CHAIN_ID : ETHEREUM_MAINNET_CHAIN_ID;
  const chain = allEvmChains[chainId];
  const stakingEthereum = useMemo(() => (chain && !chain.disabled ? makeEthereumToolkit(chain) : null), [chain]);

  const getStats = useCallback(() => {
    if (!stakingEthereum) return;

    return stakingEthereum.contractViewsStats(evmAddress);
  }, [stakingEthereum, evmAddress]);

  const { data: stats, isLoading } = useTypedSWR(['eth-staking-balances-item', evmAddress, chainId], getStats, {
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
    const amount = BigNumber.sum(depositedBalanceOf, restakedRewardOf, pendingStaked);

    if (amount.lte(0)) return;

    return { amount, isLoading };
  }, [stats, isLoading]);

  return <EarnItem offer={getEthSavingOffer(isTestnet)} deposit={deposit} />;
};
