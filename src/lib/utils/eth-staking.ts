import { Ethereum } from '@temple-wallet/everstake-wallet-sdk';
import BigNumber from 'bignumber.js';
import memoizee from 'memoizee';

import { useTypedSWR } from 'lib/swr';
import { ETHEREUM_HOODI_CHAIN_ID } from 'lib/temple/types';
import { getViemPublicClient } from 'temple/evm';
import { useAllEvmChains } from 'temple/front';
import { EvmNetworkEssentials } from 'temple/networks';

interface ActiveDeposit {
  amount?: BigNumber;
  isLoading: boolean;
}

export const makeEthereumToolkit = memoizee(
  (network: EvmNetworkEssentials) =>
    new Ethereum(network.chainId === ETHEREUM_HOODI_CHAIN_ID ? 'hoodi' : 'mainnet', getViemPublicClient(network)),
  { normalizer: args => JSON.stringify(args) }
);

export const useEthStakingDeposit = (evmAddress: string, chainId: number) => {
  const allEvmChains = useAllEvmChains();
  const chain = allEvmChains[chainId];
  const stakingEthereum = chain && !chain.disabled ? makeEthereumToolkit(chain) : null;

  const getStats = () => {
    if (!stakingEthereum) return;

    return stakingEthereum.contractViewsStats(evmAddress);
  };

  const { data: stats, isLoading } = useTypedSWR(['eth-staking-balances-item', evmAddress, chainId], getStats, {
    revalidateOnFocus: false
  });

  let deposit: ActiveDeposit | undefined;
  if (isLoading) {
    deposit = { isLoading: true };
  } else if (stats) {
    const {
      pendingBalanceOf,
      depositedBalanceOf,
      restakedRewardOf,
      pendingRestakedRewardOf,
      pendingDepositedBalanceOf
    } = stats;

    const pendingStaked = BigNumber.sum(pendingBalanceOf, pendingDepositedBalanceOf, pendingRestakedRewardOf);
    const amount = BigNumber.sum(depositedBalanceOf, restakedRewardOf, pendingStaked);

    deposit = amount.lte(0) ? undefined : { amount, isLoading };
  }

  return deposit;
};
