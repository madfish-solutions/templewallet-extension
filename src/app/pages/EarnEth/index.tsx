import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { getEthAccountTransactions, getEthValidatorsQueueStats } from '@temple-wallet/everstake-wallet-sdk';
import BigNumber from 'bignumber.js';

import { IconBase, Money } from 'app/atoms';
import { StyledButton } from 'app/atoms/StyledButton';
import { Tooltip } from 'app/atoms/Tooltip';
import { useRichFormatTooltip } from 'app/hooks/use-rich-format-tooltip';
import { ReactComponent as ActivityIcon } from 'app/icons/base/activity.svg';
import { ReactComponent as DollarRebootIcon } from 'app/icons/base/dollar_reboot.svg';
import { ReactComponent as GiftIcon } from 'app/icons/base/gift.svg';
import { ReactComponent as GiftFillIcon } from 'app/icons/base/gift_fill.svg';
import { ReactComponent as NoLockIcon } from 'app/icons/base/no-lock.svg';
import { ReactComponent as SecurityIcon } from 'app/icons/base/security.svg';
import { EarnPromoAdvantageItem, EarnPromoLayout } from 'app/layouts/EarnPromoLayout';
import PageLayout from 'app/layouts/PageLayout';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { StakingCard } from 'app/templates/staking-card';
import { getEvmNewBlockListener } from 'lib/evm/on-chain/evm-transfer-subscriptions/evm-new-block-listener';
import { T, t } from 'lib/i18n';
import { formatDuration } from 'lib/i18n/core';
import { useTypedSWR } from 'lib/swr';
import { ETHEREUM_HOODI_CHAIN_ID, ETHEREUM_MAINNET_CHAIN_ID, TempleAccountType } from 'lib/temple/types';
import { useUpdatableRef } from 'lib/ui/hooks';
import { Lottie } from 'lib/ui/react-lottie';
import { ONE_DAY_SECONDS } from 'lib/utils/numbers';
import { EvmChain, useAccount, useAccountAddressForEvm, useAllEvmChains } from 'temple/front';

import { ClaimModal } from './claim-modal';
import { ProviderCard } from './components/provider-card';
import { ETH_COIN_ANIMATION_OPTIONS } from './constants';
import { EarnEthSelectors } from './selectors';
import { StakingModal } from './staking-modal';
import { EthStakingStats } from './types';
import { UnstakeModal } from './unstake-modal';
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
  restakedRewardOf,
  withdrawRequest
}: EthStakingStats) =>
  [
    autocompoundBalanceOf,
    depositedBalanceOf,
    pendingBalanceOf,
    pendingDepositedBalanceOf,
    pendingRestakedRewardOf,
    restakedRewardOf,
    withdrawRequest.readyForClaim,
    withdrawRequest.requested
  ].some(value => value.gt(0));

enum EarnEthPageContentModal {
  Stake = 'stake',
  Unstake = 'unstake',
  Claim = 'claim'
}

const modals = {
  [EarnEthPageContentModal.Stake]: StakingModal,
  [EarnEthPageContentModal.Unstake]: UnstakeModal,
  [EarnEthPageContentModal.Claim]: ClaimModal
};

export const EarnEthPage = memo(() => {
  const isTestnet = useTestnetModeEnabledSelector();
  const evmAddress = useAccountAddressForEvm();
  const allEvmChains = useAllEvmChains();
  const chain = allEvmChains[isTestnet ? ETHEREUM_HOODI_CHAIN_ID : ETHEREUM_MAINNET_CHAIN_ID];
  const stakingEthereum = useMemo(() => (chain && !chain.disabled ? makeEthereumToolkit(chain) : null), [chain]);

  const [currentModal, setCurrentModal] = useState<EarnEthPageContentModal | null>(null);
  const openModalFactory = useCallback((modal: EarnEthPageContentModal) => () => setCurrentModal(modal), []);
  const closeCurrentModal = useCallback(() => setCurrentModal(null), []);
  const openStakeModal = useMemo(() => openModalFactory(EarnEthPageContentModal.Stake), [openModalFactory]);
  const openUnstakeModal = useMemo(() => openModalFactory(EarnEthPageContentModal.Unstake), [openModalFactory]);
  const openClaimModal = useMemo(() => openModalFactory(EarnEthPageContentModal.Claim), [openModalFactory]);
  const Modal = currentModal && modals[currentModal];

  const getStats = useCallback(async () => {
    if (!evmAddress || !stakingEthereum) return null;

    const [contractViewsStats, validatorsQueueStats, [lastUnstakeTransaction]] = await Promise.all([
      stakingEthereum.contractViewsStats(evmAddress),
      getEthValidatorsQueueStats(),
      getEthAccountTransactions({ account: evmAddress, operation: 'unstake', limit: 1 })
    ]);

    return { ...contractViewsStats, ...validatorsQueueStats, lastUnstakeTimestamp: lastUnstakeTransaction?.created_at };
  }, [stakingEthereum, evmAddress]);
  const {
    data: stats,
    mutate: updateStats,
    isValidating
  } = useTypedSWR(['eth-staking-balances', evmAddress, chain?.chainId], getStats, {
    suspense: true,
    revalidateOnFocus: false
  });
  const isValidatingRef = useUpdatableRef(isValidating);
  const blockListener = useMemo(() => getEvmNewBlockListener(chain), [chain]);
  useEffect(() => {
    const listenFn = () => {
      !isValidatingRef.current && updateStats();
    };

    blockListener.subscribe(listenFn);

    return () => blockListener.unsubscribe(listenFn);
  }, [blockListener, updateStats, isValidatingRef]);

  return (
    <>
      {stats && someStakeActivity(stats) ? (
        <EarnEthPageLayout
          chain={chain}
          stats={stats}
          openUnstakeModal={openUnstakeModal}
          openStakeModal={openStakeModal}
          openClaimModal={openClaimModal}
        />
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
          onActionClick={openStakeModal}
          actionTestID={EarnEthSelectors.stakeButton}
        />
      )}

      {stats && Modal && <Modal chain={chain} stats={stats} onRequestClose={closeCurrentModal} />}
    </>
  );
});

interface EarnEthPageLayoutProps {
  chain: EvmChain;
  stats: EthStakingStats;
  openUnstakeModal: EmptyFn;
  openStakeModal: EmptyFn;
  openClaimModal: EmptyFn;
}

const EarnEthPageLayout = memo<EarnEthPageLayoutProps>(
  ({ chain, stats, openUnstakeModal, openStakeModal, openClaimModal }) => {
    const { symbol: currencySymbol } = chain.currency;
    const {
      pendingBalanceOf,
      depositedBalanceOf,
      restakedRewardOf,
      pendingRestakedRewardOf,
      pendingDepositedBalanceOf,
      withdrawRequest
    } = stats;
    const { requested, readyForClaim } = withdrawRequest;
    const account = useAccount();
    const isWatchOnlyAccount = account.type === TempleAccountType.WatchOnly;
    console.log('oy vey 1', JSON.stringify(stats.withdrawRequestQueueParams));

    const pendingStaked = useMemo(
      () => BigNumber.sum(pendingBalanceOf, pendingDepositedBalanceOf, pendingRestakedRewardOf),
      [pendingBalanceOf, pendingDepositedBalanceOf, pendingRestakedRewardOf]
    );
    const totalStaked = useMemo(
      () => BigNumber.sum(depositedBalanceOf, restakedRewardOf).plus(pendingStaked),
      [depositedBalanceOf, restakedRewardOf, pendingStaked]
    );
    const rewards = useMemo(
      () => restakedRewardOf.plus(pendingRestakedRewardOf),
      [restakedRewardOf, pendingRestakedRewardOf]
    );

    return (
      <PageLayout pageTitle="Earn ETH" contentPadding={false}>
        <div className="flex flex-col p-4 pb-8">
          <p className="text-font-description-bold mb-1 py-1">
            <T id="provider" />
          </p>
          <ProviderCard className="mb-6" stats={stats} />
          <div className="flex items-center justify-between mb-1">
            <span className="text-font-description-bold">
              <T id="ethStaking" />
            </span>

            <Tooltip
              content={<T id="ethStakingTooltipText" />}
              wrapperClassName="max-w-[14.5rem]"
              className="text-grey-2"
            />
          </div>
          <StakingCard
            className="mb-4"
            topInfo={
              <div className="flex w-full gap-0.5 justify-between items-center">
                <div className="flex flex-col gap-0.5">
                  <span className="text-font-description text-grey-1">
                    <T id="totalStaked" />
                  </span>
                  <span className="text-font-num-bold-14">
                    <Money smallFractionFont={false}>{totalStaked}</Money> {currencySymbol}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5 text-right">
                  <span className="text-font-description text-grey-1">
                    <T id="pendingRewards" />
                  </span>
                  <span className="text-font-num-14">
                    <Money smallFractionFont={false}>{pendingStaked}</Money> {currencySymbol}
                  </span>
                </div>
              </div>
            }
            bottomInfo={
              <div className="flex w-full gap-0.5 justify-between items-center">
                <div className="flex items-center">
                  <IconBase Icon={GiftIcon} className="text-secondary" />
                  <span className="text-font-description text-grey-1 mr-0.5">
                    <T id="rewards" />
                  </span>
                  <Tooltip content={<T id="ethRewardsTooltip" />} className="text-grey-2" />
                </div>
                <span className="text-font-num-12 align-middle">
                  <Money smallFractionFont={false}>{rewards}</Money> {currencySymbol}
                </span>
              </div>
            }
            actions={
              <>
                <StyledButton
                  color="primary-low"
                  size="M"
                  className="flex-1"
                  onClick={openUnstakeModal}
                  disabled={/* isWatchOnlyAccount || */ depositedBalanceOf.isZero()}
                >
                  <T id="unstake" />
                </StyledButton>
                <StyledButton
                  color="primary"
                  size="M"
                  className="flex-1"
                  onClick={openStakeModal}
                  disabled={isWatchOnlyAccount}
                >
                  <T id="stake" />
                </StyledButton>
              </>
            }
          />
          <div className="flex items-center justify-between mb-1">
            <span className="text-font-description-bold">
              <T id="withdrawals" />
            </span>

            <Tooltip
              content={<T id="ethWithdrawalsTooltipText" />}
              className="text-grey-2"
              wrapperClassName="max-w-[11.75rem]"
            />
          </div>

          {requested.isZero() && readyForClaim.isZero() ? (
            <div className="flex flex-col justify-center items-center gap-2 bg-white rounded-lg shadow-bottom h-29 text-grey-2">
              <IconBase Icon={ActivityIcon} />

              <span className="text-font-description">
                <T id="noWithdrawalsYet" />
              </span>
            </div>
          ) : (
            <StakingCard
              topInfo={
                <div className="flex w-full gap-0.5 justify-between items-center">
                  <span className="text-font-medium-bold">
                    <T id="pendingBalance" />
                  </span>
                  {readyForClaim.lt(1e-6) ? (
                    <NotReadyClaimButton stats={stats} />
                  ) : (
                    <StyledButton color="primary" size="S" onClick={openClaimModal}>
                      <T id="claim" />
                      {requested.isZero() ? null : (
                        <>
                          {' '}
                          <Money smallFractionFont={false}>{readyForClaim}</Money>
                        </>
                      )}
                    </StyledButton>
                  )}
                </div>
              }
              bottomInfo={
                <div className="flex flex-col gap-0.5">
                  <span className="text-font-description text-grey-1">
                    <T id="amount" />:
                  </span>
                  <span className="text-font-num-12">
                    <Money smallFractionFont={false}>{requested.plus(readyForClaim)}</Money> {currencySymbol}
                  </span>
                </div>
              }
            />
          )}
        </div>
      </PageLayout>
    );
  }
);

const notReadyClaimTooltipProps = {
  trigger: 'mouseenter',
  hideOnClick: true,
  animation: 'shift-away-subtle',
  placement: 'bottom-end'
} as const;
const wrapperFactory = () => {
  const element = document.createElement('div');
  element.className = 'max-w-60';

  return element;
};

const NotReadyClaimButton = memo<{ stats: EthStakingStats }>(({ stats }) => {
  const { validator_withdraw_time, validator_exit_time, lastUnstakeTimestamp } = stats;
  const notReadyClaimTooltipContent = useMemo(() => {
    const secondsLeft =
      validator_exit_time +
      validator_withdraw_time -
      (lastUnstakeTimestamp ? Math.floor((Date.now() - new Date(lastUnstakeTimestamp).getTime()) / 1000) : 0);

    return t('notReadyClaimTooltip', formatDuration(secondsLeft, secondsLeft < ONE_DAY_SECONDS ? ['hours'] : ['days']));
  }, [validator_exit_time, validator_withdraw_time, lastUnstakeTimestamp]);

  const tooltipRef = useRichFormatTooltip<HTMLDivElement>(
    notReadyClaimTooltipProps,
    wrapperFactory,
    notReadyClaimTooltipContent
  );

  return (
    <div ref={tooltipRef}>
      <StyledButton color="primary" size="S" disabled>
        <T id="claim" />
      </StyledButton>
    </div>
  );
});
