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
  const { validator_activation_time, validator_adding_delay, balance, pendingBalance, pendingDepositedBalance } = stats;
  const hasActivationData = validator_activation_time != null && validator_adding_delay != null;
  const activationTimeSeconds = (validator_activation_time ?? 0) + (validator_adding_delay ?? 0);
  const longFormattedActivationTime = useMemo(
    () =>
      hasActivationData
        ? formatDuration(
            activationTimeSeconds,
            activationTimeSeconds < ONE_DAY_SECONDS ? ['hours', 'minutes', 'seconds'] : ['days', 'hours']
          )
        : 'N/A',
    [hasActivationData, activationTimeSeconds]
  );
  const shortFormattedActivationTime = useMemo(
    () =>
      hasActivationData
        ? formatDuration(activationTimeSeconds, activationTimeSeconds < ONE_DAY_SECONDS ? ['hours'] : ['days'])
        : 'N/A',
    [hasActivationData, activationTimeSeconds]
  );

  const stakedAmount = useMemo(
    () => toShortened(BigNumber.sum(balance, pendingBalance, pendingDepositedBalance)),
    [balance, pendingBalance, pendingDepositedBalance]
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
