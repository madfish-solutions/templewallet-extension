import { RpStatsResponse } from 'lib/apis/ads-api';
import { createActions } from 'lib/store';

interface LoadRewardsInput {
  account: string;
}

interface LoadRewardsErrorPayload extends LoadRewardsInput {
  error: string;
}

export const loadTodayRewardsActions = createActions<
  LoadRewardsInput,
  LoadRewardsInput & { value: RpStatsResponse },
  LoadRewardsErrorPayload
>('rewards/LOAD_TODAY_REWARDS');

export const loadManyMonthsRewardsActions = createActions<
  LoadRewardsInput & { monthYearIndexes: number[] },
  LoadRewardsInput & { values: StringRecord<RpStatsResponse>; firstActivityDate: string | null },
  LoadRewardsErrorPayload
>('rewards/LOAD_MANY_MONTHS_REWARDS');
