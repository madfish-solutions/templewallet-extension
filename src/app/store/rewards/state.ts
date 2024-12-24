import { RpStatsResponse } from 'lib/apis/ads-api';
import { LoadableEntityState } from 'lib/store';

export interface RewardsState {
  rpForToday: StringRecord<LoadableEntityState<RpStatsResponse>>;
  rpForMonths: StringRecord<LoadableEntityState<StringRecord<RpStatsResponse>>>;
  firstActivityDates: StringRecord<string | null>;
}

export const rewardsInitialState: RewardsState = {
  rpForToday: {},
  rpForMonths: {},
  firstActivityDates: {}
};
