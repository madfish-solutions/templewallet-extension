import React, { memo, useCallback, useEffect, useRef } from 'react';

import { capitalize, range } from 'lodash';

import { Alert, PageTitle } from 'app/atoms';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { acknowledgeRewardsBadge } from 'app/hooks/use-rewards-badge';
import PageLayout from 'app/layouts/PageLayout';
import { ReferralsCard } from 'app/pages/Rewards/referrals-card';
import { YourRewardsCards } from 'app/pages/Rewards/your-rewards-cards';
import { dispatch } from 'app/store';
import { loadManyMonthsRewardsActions, loadTodayRewardsActions } from 'app/store/rewards/actions';
import { useRpForMonthsErrorSelector, useRpForTodayErrorSelector } from 'app/store/rewards/selectors';
import { toMonthYearIndex } from 'lib/apis/ads-api';
import { T, t } from 'lib/i18n';
import { useInterval } from 'lib/ui/hooks';
import { ONE_DAY_MS, ONE_HOUR_MS } from 'lib/utils/numbers';
import { useAccountAddressForTezos } from 'temple/front';

export const RewardsPage = memo(() => {
  const accountPkh = useAccountAddressForTezos();
  if (!accountPkh) throw new DeadEndBoundaryError();

  const dailyIntervalRef = useRef<NodeJS.Timer | null>(null);
  const midnightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rpForTodayError = useRpForTodayErrorSelector(accountPkh);
  const rpForMonthsError = useRpForMonthsErrorSelector(accountPkh);

  const updateStatsDate = useCallback(() => {
    return new Date();
  }, []);

  const updateRecentEarnings = useCallback(() => {
    const newStatsDate = updateStatsDate();
    dispatch(loadTodayRewardsActions.submit({ account: accountPkh }));
    dispatch(
      loadManyMonthsRewardsActions.submit({
        account: accountPkh,
        monthYearIndexes: [toMonthYearIndex(newStatsDate)]
      })
    );
  }, [accountPkh, updateStatsDate]);

  useInterval(updateRecentEarnings, [updateRecentEarnings], ONE_HOUR_MS, false);

  useEffect(() => {
    void acknowledgeRewardsBadge();

    const newStatsDate = updateStatsDate();
    const currentMonthYearIndex = toMonthYearIndex(newStatsDate);
    dispatch(loadTodayRewardsActions.submit({ account: accountPkh }));
    dispatch(
      loadManyMonthsRewardsActions.submit({
        account: accountPkh,
        monthYearIndexes: range(0, 4).map(i => currentMonthYearIndex - i)
      })
    );

    const tomorrowDate = newStatsDate;
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    tomorrowDate.setHours(0, 0, 0, 0);
    midnightTimeoutRef.current = setTimeout(() => {
      updateRecentEarnings();
      dailyIntervalRef.current = setInterval(() => updateRecentEarnings(), ONE_DAY_MS);
    }, tomorrowDate.getTime() - Date.now());

    return () => {
      const dailyInterval = dailyIntervalRef.current;
      const midnightTimeout = midnightTimeoutRef.current;
      dailyInterval !== null && clearInterval(dailyInterval);
      midnightTimeout !== null && clearTimeout(midnightTimeout);
    };
  }, [accountPkh, updateRecentEarnings, updateStatsDate]);

  return (
    <PageLayout pageTitle={<PageTitle title={capitalize(t('rewards'))} />}>
      <div className="pt-2 pb-6">
        <div className="w-full max-w-sm mx-auto flex flex-col gap-8">
          {(rpForTodayError || rpForMonthsError) && (
            <Alert type="error" description={<T id="somethingWentWrong" />} autoFocus />
          )}
          <ReferralsCard />
          <YourRewardsCards />
        </div>
      </div>
    </PageLayout>
  );
});
