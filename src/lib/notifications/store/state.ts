import { createEntity, LoadableEntityState } from 'lib/store';

import { NotificationInterface } from '../interfaces/notification.interface';

export interface NotificationsState {
  startFromTime: number;
  list: LoadableEntityState<NotificationInterface[]>;
  isNewsEnabled: boolean;
}

export const notificationsInitialState: NotificationsState = {
  startFromTime: new Date().getTime(),
  list: createEntity([]),
  isNewsEnabled: true
};

export interface NotificationsRootState {
  notifications: NotificationsState;
}
