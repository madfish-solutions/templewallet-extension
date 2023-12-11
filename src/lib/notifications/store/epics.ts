import { combineEpics, Epic } from 'redux-observable';
import { of } from 'rxjs';
import { catchError, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { Action } from 'ts-action';
import { ofType } from 'ts-action-operators';

import type { RootState } from 'app/store/root-state.type';

import { loadNotifications$ } from '../utils/api.utils';

import { loadNotificationsAction } from './actions';

const loadNotificationsEpic: Epic<Action, Action, RootState> = (action$, state$) =>
  action$.pipe(
    ofType(loadNotificationsAction.submit),
    withLatestFrom(state$),
    switchMap(([, rootState]) =>
      loadNotifications$(rootState.notifications.startFromTime).pipe(
        map(newNotifications => loadNotificationsAction.success(newNotifications)),
        catchError(err => of(loadNotificationsAction.fail(err.message)))
      )
    )
  );

export const notificationsEpics = combineEpics(loadNotificationsEpic);
