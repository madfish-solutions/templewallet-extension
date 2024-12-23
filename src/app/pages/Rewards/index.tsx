import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

import { capitalize, range } from 'lodash';
import { useDispatch } from 'react-redux';

import { Alert, PageTitle } from 'app/atoms';
import PageLayout from 'app/layouts/PageLayout';
import { loadManyMonthsRewardsActions, loadTodayRewardsActions } from 'app/store/rewards/actions';
import { useRpForMonthsErrorSelector, useRpForTodayErrorSelector } from 'app/store/rewards/selectors';
import { toMonthYearIndex } from 'lib/apis/ads-api';
import { T, t } from 'lib/i18n';
import { useAccountPkh } from 'lib/temple/front';
import { useInterval } from 'lib/ui/hooks';
import { ONE_DAY_MS, ONE_HOUR_MS } from 'lib/utils/numbers';

import { Achievements } from './achievements';
import { ActiveFeatures } from './active-features';
import { LifetimeEarnings } from './lifetime-earnings';
import { RecentEarnings } from './recent-earnings';

export const RewardsPage = memo(() => {
  const dispatch = useDispatch();
  const accountPkh = useAccountPkh();
  const dailyIntervalRef = useRef<NodeJS.Timer | null>(null);
  const midnightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rpForTodayError = useRpForTodayErrorSelector(accountPkh);
  const rpForMonthsError = useRpForMonthsErrorSelector(accountPkh);
  const [statsDate, setStatsDate] = useState(() => new Date());

  const updateStatsDate = useCallback(() => {
    const newStatsDate = new Date();
    setStatsDate(newStatsDate);

    return newStatsDate;
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
  }, [accountPkh, dispatch, updateStatsDate]);

  useInterval(updateRecentEarnings, ONE_HOUR_MS, [updateRecentEarnings], false);

  useEffect(() => {
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
  }, [accountPkh, dispatch, updateRecentEarnings, updateStatsDate]);

  return (
    <PageLayout pageTitle={<PageTitle icon={<div />} title={capitalize(t('rewards'))} />}>
      <div className="pt-2 pb-6">
        <div className="w-full max-w-sm mx-auto flex flex-col gap-8">
          {(rpForTodayError || rpForMonthsError) && (
            <Alert type="error" description={<T id="somethingWentWrong" />} autoFocus />
          )}
          <RecentEarnings statsDate={statsDate} />
          <ActiveFeatures />
          <Achievements />
          <LifetimeEarnings statsDate={statsDate} />
        </div>
      </div>
    </PageLayout>
  );
});
