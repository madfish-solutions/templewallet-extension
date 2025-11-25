import React, { memo, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { Tooltip } from 'app/atoms/Tooltip';
import { StakingCard } from 'app/templates/staking-card';
import { StakingStatsEntry } from 'app/templates/staking-stats-entry';
import { T, t, toShortened } from 'lib/i18n';
import { formatDuration } from 'lib/i18n/core';
import { toPercentage } from 'lib/ui/utils';
import { ONE_DAY_SECONDS } from 'lib/utils/numbers';

import { EthStakingStats } from '../types';

interface ProviderCardProps {
  className?: string;
  stats: EthStakingStats;
}

export const ProviderCard = memo<ProviderCardProps>(({ className, stats }) => {
  const activationTimeSeconds = useMemo(() => stats.validator_activation_time + stats.validator_adding_delay, [stats]);
  const longFormattedActivationTime = useMemo(
    () =>
      formatDuration(
        activationTimeSeconds,
        activationTimeSeconds < ONE_DAY_SECONDS ? ['hours', 'minutes', 'seconds'] : ['days', 'hours']
      ),
    [activationTimeSeconds]
  );
  const shortFormattedActivationTime = useMemo(
    () => formatDuration(activationTimeSeconds, activationTimeSeconds < ONE_DAY_SECONDS ? ['hours'] : ['days']),
    [activationTimeSeconds]
  );

  const stakedAmount = useMemo(
    () => toShortened(BigNumber.sum(stats.balance, stats.pendingBalance, stats.pendingDepositedBalance)),
    [stats]
  );

  return (
    <StakingCard
      className={className}
      topInfo={
        <div className="flex items-center gap-2">
          <img
            src="https://services.tzkt.io/v1/avatars/tz1aRoaRhSpRYvFdyvgWLL6TGyRoGF51wDjM"
            alt="Everstake icon"
            className="w-6 h-6 rounded"
          />
          <span className="text-font-medium-bold">Everstake</span>
        </div>
      }
      bottomInfo={
        <>
          <StakingStatsEntry name={t('estimatedApr')} value="3.4-10%" />
          <StakingStatsEntry name={t('staking')} value={stakedAmount} />
          <StakingStatsEntry name={t('fee')} value={toPercentage(stats.poolFee)} />
          <StakingStatsEntry
            name={t('activation')}
            tooltip={
              <Tooltip
                className="text-grey-2"
                size={12}
                content={<T id="activationTimeTooltip" substitutions={longFormattedActivationTime} />}
                wrapperClassName="max-w-[13.25rem]"
              />
            }
            value={shortFormattedActivationTime}
          />
        </>
      }
    />
  );
});
