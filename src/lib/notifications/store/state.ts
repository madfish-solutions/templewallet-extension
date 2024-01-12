import { createEntity, LoadableEntityState } from 'lib/store';

import type { NotificationInterface } from '../types';

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
