import React, { memo, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { IconBase, Money } from 'app/atoms';
import { StyledButton } from 'app/atoms/StyledButton';
import { Tooltip } from 'app/atoms/Tooltip';
import { ReactComponent as GiftIcon } from 'app/icons/base/gift.svg';
import { StakingCard } from 'app/templates/staking-card';
import { T } from 'lib/i18n';
import { TempleAccountType } from 'lib/temple/types';
import { useAccount } from 'temple/front';

import { EthStakingStats } from '../types';

interface TotalStakingStatsCardProps {
  className?: string;
  currencySymbol: string;
  stats: EthStakingStats;
  openStakeModal: EmptyFn;
  openUnstakeModal: EmptyFn;
}

export const TotalStakingStatsCard = memo<TotalStakingStatsCardProps>(
  ({ className, currencySymbol, stats, openStakeModal, openUnstakeModal }) => {
    const account = useAccount();
    const isWatchOnlyAccount = account.type === TempleAccountType.WatchOnly;
    const {
      pendingBalanceOf,
      depositedBalanceOf,
      restakedRewardOf,
      pendingRestakedRewardOf,
      pendingDepositedBalanceOf
    } = stats;

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
      <StakingCard
        className={className}
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
              disabled={isWatchOnlyAccount || depositedBalanceOf.isZero()}
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
    );
  }
);
