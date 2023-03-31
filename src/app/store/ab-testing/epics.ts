import { combineEpics } from 'redux-observable';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Action } from 'ts-action';
import { ofType } from 'ts-action-operators';

import { getABGroup$ } from 'lib/apis/temple';

import { getUserTestingGroupName } from './actions';

const getUserTestingGroupNameEpic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(getUserTestingGroupName.submit),
    switchMap(() =>
      getABGroup$().pipe(
        map(testingGroupName => getUserTestingGroupName.success(testingGroupName)),
        catchError(err => of(getUserTestingGroupName.fail(err.message)))
      )
    )
  );

export const abTestingEpics = combineEpics(getUserTestingGroupNameEpic);
