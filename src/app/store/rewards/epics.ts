import { combineEpics, Epic } from 'redux-observable';
import { catchError, from, map, mergeMap, of, switchMap } from 'rxjs';
import { ofType } from 'ts-action-operators';

import { importAdsApiModule, RpStatsResponse } from 'lib/apis/ads-api';

import { loadManyMonthsRewardsActions, loadTodayRewardsActions } from './actions';

const loadTodayRewardsEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadTodayRewardsActions.submit),
    switchMap(({ payload }) =>
      from(importAdsApiModule().then(({ fetchRpForToday }) => fetchRpForToday(payload.account))).pipe(
        map(value => loadTodayRewardsActions.success({ ...payload, value })),
        catchError(error => of(loadTodayRewardsActions.fail({ ...payload, error: error.message })))
      )
    )
  );

const loadManyMonthsRewardsEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadManyMonthsRewardsActions.submit),
    mergeMap(({ payload }) => {
      const { account, monthYearIndexes } = payload;

      return from(
        importAdsApiModule().then(({ fetchRpForMonth }) =>
          Promise.all(monthYearIndexes.map(index => fetchRpForMonth(account, index)))
        )
      ).pipe(
        map(values =>
          loadManyMonthsRewardsActions.success({
            ...payload,
            firstActivityDate: values.at(0)!.firstActivityDate,
            values: Object.fromEntries(
              values.map(({ firstActivityDate, ...value }, i): [string, RpStatsResponse] => [
                String(monthYearIndexes[i]),
                value
              ])
            )
          })
        ),
        catchError(error => of(loadManyMonthsRewardsActions.fail({ ...payload, error: error.message })))
      );
    })
  );

export const rewardsEpics = combineEpics(loadTodayRewardsEpic, loadManyMonthsRewardsEpic);
