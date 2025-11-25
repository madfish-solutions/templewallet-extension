import React, { memo, useCallback, useMemo } from 'react';

import { getEthValidatorsQueueStats } from '@temple-wallet/everstake-wallet-sdk';

import { ReactComponent as DollarRebootIcon } from 'app/icons/base/dollar_reboot.svg';
import { ReactComponent as GiftFillIcon } from 'app/icons/base/gift_fill.svg';
import { ReactComponent as NoLockIcon } from 'app/icons/base/no-lock.svg';
import { ReactComponent as SecurityIcon } from 'app/icons/base/security.svg';
import { EarnPromoAdvantageItem, EarnPromoLayout } from 'app/layouts/EarnPromoLayout';
import PageLayout from 'app/layouts/PageLayout';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { T } from 'lib/i18n';
import { useTypedSWR } from 'lib/swr';
import { ETHEREUM_HOODI_CHAIN_ID, ETHEREUM_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useBooleanState } from 'lib/ui/hooks';
import { Lottie } from 'lib/ui/react-lottie';
import { useAccountAddressForEvm, useAllEvmChains } from 'temple/front';

import { ETH_COIN_ANIMATION_OPTIONS } from './constants';
import { EarnEthSelectors } from './selectors';
import { StakingModal } from './staking-modal';
import { EthStakingStats } from './types';
import { makeEthereumToolkit } from './utils';

const advantages: EarnPromoAdvantageItem[] = [
  { Icon: NoLockIcon, textI18nKey: 'nonCustodialStaking' },
  { Icon: DollarRebootIcon, textI18nKey: 'higherRewardsSystem' },
  { Icon: SecurityIcon, textI18nKey: 'verifiedSecurity' },
  { Icon: GiftFillIcon, textI18nKey: 'stakeGetAirdrops' }
];

const someStakeActivity = ({
  autocompoundBalanceOf,
  depositedBalanceOf,
  pendingBalanceOf,
  pendingDepositedBalanceOf,
  pendingRestakedRewardOf,
  restakedRewardOf
}: EthStakingStats) => {
  return [
    autocompoundBalanceOf,
    depositedBalanceOf,
    pendingBalanceOf,
    pendingDepositedBalanceOf,
    pendingRestakedRewardOf,
    restakedRewardOf
  ].some(balance => balance.gt(0));
};

export const EarnEthPage = memo(() => {
  const isTestnet = useTestnetModeEnabledSelector();
  const evmAddress = useAccountAddressForEvm();
  const allEvmChains = useAllEvmChains();
  const chain = allEvmChains[isTestnet ? ETHEREUM_HOODI_CHAIN_ID : ETHEREUM_MAINNET_CHAIN_ID];
  const stakingEthereum = useMemo(() => (chain && !chain.disabled ? makeEthereumToolkit(chain) : null), [chain]);
  const [stakingModalIsOpen, openStakingModal, closeStakingModal] = useBooleanState(false);

  const getStats = useCallback(async () => {
    if (!evmAddress || !stakingEthereum) return null;

    const [contractViewsStats, validatorsQueueStats] = await Promise.all([
      stakingEthereum.contractViewsStats(evmAddress),
      getEthValidatorsQueueStats()
    ]);

    return { ...contractViewsStats, ...validatorsQueueStats };
  }, [stakingEthereum, evmAddress]);
  const { data: stats } = useTypedSWR(['eth-staking-balances', evmAddress, chain?.chainId], getStats, {
    suspense: true,
    refreshInterval: 30000,
    revalidateOnFocus: false
  });

  return (
    <>
      {stats && someStakeActivity(stats) ? (
        <EarnEthPageLayout stats={stats} />
      ) : (
        <EarnPromoLayout
          pageTitle="Earn ETH"
          TopVisual={<Lottie isClickToPauseDisabled options={ETH_COIN_ANIMATION_OPTIONS} height={172} width={172} />}
          headline={<T id="earnEthHeadline" />}
          advantages={advantages}
          advantageIconClassName="text-secondary"
          disclaimer={<T id="earnWithEverstakeDisclaimer" />}
          actionText={
            stakingEthereum ? (
              <T id="stake" />
            ) : (
              <T
                id={chain ? 'enableNetworkToContinue' : 'addNetworkToContinue'}
                substitutions={isTestnet ? 'Ethereum Hoodi' : 'Ethereum'}
              />
            )
          }
          actionDisabled={!stakingEthereum}
          actionColor="secondary"
          onActionClick={openStakingModal}
          actionTestID={EarnEthSelectors.stakeButton}
        />
      )}

      {stats && stakingModalIsOpen && <StakingModal chain={chain} stats={stats} onRequestClose={closeStakingModal} />}
    </>
  );
});

const EarnEthPageLayout = memo<{ stats: EthStakingStats }>(({ stats }) => {
  return (
    <PageLayout pageTitle="Earn ETH" contentPadding={false}>
      <div className="flex-1 px-4 pt-4 pb-8">
        <pre>{JSON.stringify(stats, null, 2)}</pre>
      </div>
    </PageLayout>
  );
});
