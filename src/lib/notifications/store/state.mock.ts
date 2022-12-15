import { createEntity } from 'lib/store';

import { NotificationsState } from './state';

export const mockNotificationsState: NotificationsState = {
  startFromTime: new Date('2022-11-29T13:00:00.000Z').getTime(),
  list: createEntity([]),
  isNewsEnabled: true
};
