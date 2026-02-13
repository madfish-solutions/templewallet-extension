import React, { memo } from 'react';

import { IconBase, Money } from 'app/atoms';
import { StyledButton } from 'app/atoms/StyledButton';
import { Tooltip } from 'app/atoms/Tooltip';
import { ReactComponent as ActivityIcon } from 'app/icons/base/activity.svg';
import PageLayout from 'app/layouts/PageLayout';
import { StakingCard } from 'app/templates/staking-card';
import { MIN_ETH_EVERSTAKE_CLAIMABLE_AMOUNT } from 'lib/constants';
import { T } from 'lib/i18n';
import { TempleAccountType } from 'lib/temple/types';
import { EvmChain, useAccount } from 'temple/front';

import { NotReadyClaimButton } from './components/not-ready-claim-button';
import { ProviderCard } from './components/provider-card';
import { TotalStakingStatsCard } from './components/total-staking-stats-card';
import { EthStakingStats } from './types';

interface EarnEthPageLayoutProps {
  chain: EvmChain;
  stats: EthStakingStats;
  openUnstakeModal: EmptyFn;
  openStakeModal: EmptyFn;
  openClaimModal: EmptyFn;
}

export const EarnEthPageLayout = memo<EarnEthPageLayoutProps>(
  ({ chain, stats, openUnstakeModal, openStakeModal, openClaimModal }) => {
    const { symbol: currencySymbol } = chain.currency;
    const { requested, readyForClaim } = stats.withdrawRequest;
    const account = useAccount();
    const isWatchOnlyAccount = account.type === TempleAccountType.WatchOnly;

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
          <TotalStakingStatsCard
            className="mb-4"
            currencySymbol={currencySymbol}
            stats={stats}
            openStakeModal={openStakeModal}
            openUnstakeModal={openUnstakeModal}
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
            <div className="flex flex-col justify-center items-center gap-2 bg-white rounded-lg border-0.5 border-lines h-29 text-grey-2">
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
                  {readyForClaim.lt(MIN_ETH_EVERSTAKE_CLAIMABLE_AMOUNT) ? (
                    <NotReadyClaimButton stats={stats} />
                  ) : (
                    <StyledButton color="primary" size="S" disabled={isWatchOnlyAccount} onClick={openClaimModal}>
                      <T id="claim" />
                      {readyForClaim.eq(requested) ? null : (
                        <>
                          {' '}
                          <Money smallFractionFont={false} tooltip={false}>
                            {readyForClaim}
                          </Money>
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
                    <Money smallFractionFont={false}>{requested}</Money> {currencySymbol}
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
