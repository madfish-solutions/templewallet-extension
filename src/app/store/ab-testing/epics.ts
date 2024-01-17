import { combineEpics, Epic } from 'redux-observable';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ofType } from 'ts-action-operators';

import { getABGroup$ } from 'lib/apis/temple';

import { getUserTestingGroupNameActions } from './actions';

const getUserTestingGroupNameEpic: Epic = action$ =>
  action$.pipe(
    ofType(getUserTestingGroupNameActions.submit),
    switchMap(() =>
      getABGroup$().pipe(
        map(testingGroupName => getUserTestingGroupNameActions.success(testingGroupName)),
        catchError(err => of(getUserTestingGroupNameActions.fail(err.message)))
      )
    )
  );

export const abTestingEpics = combineEpics(getUserTestingGroupNameEpic);
