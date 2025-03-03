import { NotificationInterface } from 'app/pages/Notifications/types';
import { createEntity, LoadableEntityState } from 'lib/store';

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
