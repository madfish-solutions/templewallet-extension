import { NotificationInterface } from 'lib/notifications';
import { createEntity, LoadableEntityState } from 'lib/store';

export interface NotificationsState {
  startFromTime: number;
  list: LoadableEntityState<NotificationInterface[]>;
  isNewsEnabled: boolean;
  isAccountNotificationsEnabled: boolean;
}

export const notificationsInitialState: NotificationsState = {
  startFromTime: new Date().getTime(),
  list: createEntity([]),
  isNewsEnabled: true,
  isAccountNotificationsEnabled: true
};
