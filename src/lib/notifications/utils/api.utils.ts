import { from } from 'rxjs';
import { map } from 'rxjs/operators';

import { templeWalletApi } from 'lib/apis/temple';

import { NotificationPlatformType } from '../enums/notification-platform-type.enum';
import { NotificationStatus } from '../enums/notification-status.enum';
import type { NotificationInterface } from '../types';

export const loadNotifications$ = (startFromTime: number) =>
  from(
    templeWalletApi.get<NotificationInterface[]>('/notifications', {
      params: {
        platform: NotificationPlatformType.Extension,
        startFromTime
      }
    })
  ).pipe(map(response => response.data.map(notification => ({ ...notification, status: NotificationStatus.New }))));
