import React, { memo } from 'react';

import { t, T } from 'lib/i18n';

import { Section } from '../section';
import { RewardsPageSelectors } from '../selectors';
import { getMonthName } from '../utils';

import { StatsCard } from './stats-card';

export const RecentEarnings = memo(() => (
  <Section
    title={<T id="earnings" />}
    tooltipText={t('earningsInfoTooltip')}
    tooltipTriggerTestID={RewardsPageSelectors.earningsTooltipTrigger}
  >
    <div className="flex gap-3">
      <StatsCard
        periodName={<T id="today" />}
        rpCount={244}
        adsCount={2023}
        linksCount={323}
        background="golden"
        testID={RewardsPageSelectors.todayStatsCard}
      />
      <StatsCard
        periodName={getMonthName(new Date())}
        rpCount={1223}
        adsCount={2023}
        linksCount={323}
        background="bluish"
        testID={RewardsPageSelectors.thisMonthStatsCard}
      />
    </div>
  </Section>
));
