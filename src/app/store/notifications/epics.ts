import { combineEpics, Epic } from 'redux-observable';
import { from, of } from 'rxjs';
import { catchError, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { Action } from 'ts-action';
import { ofType } from 'ts-action-operators';

import type { RootState } from 'app/store/root-state.type';
import { fetchNotifications } from 'lib/apis/temple';
import { NotificationPlatformType, NotificationStatus, type NotificationInterface } from 'lib/notifications';

import { loadNotificationsAction } from './actions';
import { getAccountNotificationsStartID, getLatestNotificationCreatedAt } from './utils';

type NotificationsApiItem = Omit<NotificationInterface, 'status'>;

const loadNotifications$ = (startFromTime: number, startID: number, accountAddresses: string[]) =>
  from(
    fetchNotifications<NotificationsApiItem>({
      platform: NotificationPlatformType.Extension,
      startFromTime,
      startID,
      accountAddresses
    })
  ).pipe(
    map(notifications => notifications.map(notification => ({ ...notification, status: NotificationStatus.New })))
  );

const loadNotificationsEpic: Epic<Action, Action, RootState> = (action$, state$) =>
  action$.pipe(
    ofType(loadNotificationsAction.submit),
    withLatestFrom(state$),
    switchMap(([{ payload }, rootState]) => {
      const { startFromTime, list } = rootState.notifications;

      return loadNotifications$(
        Math.max(startFromTime, getLatestNotificationCreatedAt(list.data)),
        getAccountNotificationsStartID(list.data),
        payload.accountAddresses
      ).pipe(
        map(newNotifications => loadNotificationsAction.success(newNotifications)),
        catchError(err => of(loadNotificationsAction.fail(err.message)))
      );
    })
  );

export const notificationsEpics = combineEpics(loadNotificationsEpic);
