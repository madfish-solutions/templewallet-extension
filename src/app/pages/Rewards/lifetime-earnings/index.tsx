import React, { memo, useCallback, useMemo } from 'react';

import clsx from 'clsx';
import { range } from 'lodash';
import { useDispatch } from 'react-redux';

import { Button, Spinner } from 'app/atoms';
import { ReactComponent as TriangleDownIcon } from 'app/icons/triangle-down.svg';
import { loadManyMonthsRewardsActions } from 'app/store/rewards/actions';
import {
  useFirstActivityDateSelector,
  useEarliestLoadedMonthYearIndex,
  useRpForMonthsLoadingSelector,
  useLifetimeEarnings,
  useRpForMonthsErrorSelector
} from 'app/store/rewards/selectors';
import { parseMonthYearIndex, RpStatsResponse, toMonthYearIndex } from 'lib/apis/ads-api';
import { T, t } from 'lib/i18n';
import { useAccountPkh } from 'lib/temple/front';

import { Section } from '../section';
import { RewardsPageSelectors } from '../selectors';
import { formatRpAmount, getMonthName } from '../utils';

/** August 2024 */
const firstMonthWithCompleteStatsIndex = toMonthYearIndex(7, 2024);

interface Props {
  statsDate: Date;
}

export const LifetimeEarnings = memo<Props>(({ statsDate }) => {
  const dispatch = useDispatch();
  const accountPkh = useAccountPkh();
  const earliestLoadedMonthYearIndex = useEarliestLoadedMonthYearIndex(accountPkh);
  const rpForMonthsLoading = useRpForMonthsLoadingSelector(accountPkh);
  const rpForMonthsError = useRpForMonthsErrorSelector(accountPkh);
  const lifetimeEarnings = useLifetimeEarnings(accountPkh, statsDate);
  const firstActivityDate = useFirstActivityDateSelector(accountPkh);
  const failedToLoadAnyData = rpForMonthsError && lifetimeEarnings.length === 0;

  const earliestMonthYearIndexToLoad = useMemo(() => {
    if (failedToLoadAnyData) {
      return firstMonthWithCompleteStatsIndex;
    }

    return firstActivityDate
      ? Math.max(toMonthYearIndex(new Date(firstActivityDate)), firstMonthWithCompleteStatsIndex)
      : toMonthYearIndex(statsDate);
  }, [failedToLoadAnyData, firstActivityDate, statsDate]);

  const loadMore = useCallback(() => {
    dispatch(
      loadManyMonthsRewardsActions.submit({
        account: accountPkh,
        monthYearIndexes: range(1, 4)
          .map(i => (earliestLoadedMonthYearIndex ?? toMonthYearIndex(statsDate) + 1) - i)
          .filter(monthYearIndex => monthYearIndex >= earliestMonthYearIndexToLoad)
      })
    );
  }, [accountPkh, dispatch, earliestLoadedMonthYearIndex, earliestMonthYearIndexToLoad, statsDate]);

  const showLoadMoreButton = useMemo(
    () =>
      !rpForMonthsLoading &&
      ((firstActivityDate && earliestMonthYearIndexToLoad < (earliestLoadedMonthYearIndex ?? 0)) ||
        failedToLoadAnyData),
    [
      rpForMonthsLoading,
      firstActivityDate,
      earliestMonthYearIndexToLoad,
      earliestLoadedMonthYearIndex,
      failedToLoadAnyData
    ]
  );

  return (
    <Section title={t('lifetimeEarnings')}>
      {lifetimeEarnings.length === 0 && !rpForMonthsLoading && !rpForMonthsError && (
        <div
          className={clsx(
            'bg-gray-100 rounded-2xl flex flex-col justify-center items-center text-center gap-1',
            'text-sm leading-tight text-gray-500 font-medium'
          )}
          style={{ height: '8.625rem' }}
        >
          <p>
            <T id="noEarningsFound" />
          </p>
        </div>
      )}

      {lifetimeEarnings.length === 0 && rpForMonthsLoading && (
        <div className="h-15 flex justify-center items-center">
          <Spinner theme="dark-gray" className="w-12" />
        </div>
      )}

      {lifetimeEarnings.length === 0 &&
        rpForMonthsError &&
        range(1, 4).map(i => <HistoryEntry key={i} monthYearIndex={toMonthYearIndex(statsDate) - i} />)}

      {lifetimeEarnings.map(([monthYearIndex, data]) => (
        <HistoryEntry key={monthYearIndex} monthYearIndex={monthYearIndex} data={data} />
      ))}

      <div className="flex flex-col items-center mt-1">
        {rpForMonthsLoading && lifetimeEarnings.length > 0 && <Spinner theme="dark-gray" className="w-24" />}

        {showLoadMoreButton && (
          <Button
            className="h-6 flex items-center justify-center gap-0.5 text-blue-500 font-semibold text-2xs leading-snug uppercase"
            onClick={loadMore}
            testID={RewardsPageSelectors.loadMoreButton}
          >
            <T id="loadMore" />

            <TriangleDownIcon className="w-4 h-4 fill-current stroke-current" />
          </Button>
        )}
      </div>
    </Section>
  );
});

interface HistoryEntryProps {
  monthYearIndex: number;
  data?: RpStatsResponse;
}

const HistoryEntry = memo<HistoryEntryProps>(({ monthYearIndex, data }) => (
  <div className="p-4 flex items-center justify-between bg-gray-100 text-sm text-gray-910 rounded-2xl">
    <span>{getMonthName(parseMonthYearIndex(monthYearIndex))}</span>
    <span className="font-semibold">
      {data ? `${formatRpAmount(data.impressionsCount + data.referralsClicksCount)} RP` : '---'}
    </span>
  </div>
));
