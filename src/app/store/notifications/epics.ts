import { combineEpics, Epic } from 'redux-observable';
import { from, of } from 'rxjs';
import { catchError, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { Action } from 'ts-action';
import { ofType } from 'ts-action-operators';

import { NotificationPlatformType } from 'app/pages/Notifications/enums/notification-platform-type.enum';
import { NotificationStatus } from 'app/pages/Notifications/enums/notification-status.enum';
import type { NotificationInterface } from 'app/pages/Notifications/types';
import type { RootState } from 'app/store/root-state.type';
import { templeWalletApi } from 'lib/apis/temple';

import { loadNotificationsAction } from './actions';

const loadNotifications$ = (startFromTime: number) =>
  from(
    templeWalletApi.get<NotificationInterface[]>('/notifications', {
      params: {
        platform: NotificationPlatformType.Extension,
        startFromTime
      }
    })
  ).pipe(map(response => response.data.map(notification => ({ ...notification, status: NotificationStatus.New }))));

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
