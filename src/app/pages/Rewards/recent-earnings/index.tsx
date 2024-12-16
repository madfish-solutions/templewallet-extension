import React, { memo } from 'react';

import {
  useRpForMonthSelector,
  useRpForMonthsErrorSelector,
  useRpForTodayErrorSelector,
  useRpForTodaySelector
} from 'app/store/rewards/selectors';
import { toMonthYearIndex } from 'lib/apis/ads-api';
import { t, T } from 'lib/i18n';
import { useAccountPkh } from 'lib/temple/front';

import { Section } from '../section';
import { RewardsPageSelectors } from '../selectors';
import { getMonthName } from '../utils';

import { StatsCard } from './stats-card';

interface Props {
  statsDate: Date;
}

export const RecentEarnings = memo<Props>(({ statsDate }) => {
  const accountPkh = useAccountPkh();
  const rpForToday = useRpForTodaySelector(accountPkh);
  const rpForTodayError = useRpForTodayErrorSelector(accountPkh);
  const rpForMonth = useRpForMonthSelector(accountPkh, toMonthYearIndex(statsDate));
  const rpForMonthsError = useRpForMonthsErrorSelector(accountPkh);

  return (
    <Section
      title={<T id="earnings" />}
      tooltipText={t('earningsInfoTooltip')}
      tooltipTriggerTestID={RewardsPageSelectors.earningsTooltipTrigger}
    >
      <div className="flex gap-3">
        <StatsCard
          periodName={<T id="today" />}
          data={rpForToday}
          error={rpForTodayError}
          background="golden"
          testID={RewardsPageSelectors.todayStatsCard}
        />
        <StatsCard
          periodName={getMonthName(statsDate)}
          data={rpForMonth}
          error={rpForMonthsError}
          background="bluish"
          testID={RewardsPageSelectors.thisMonthStatsCard}
        />
      </div>
    </Section>
  );
});
