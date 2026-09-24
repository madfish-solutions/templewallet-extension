import {
  array as arraySchema,
  boolean as booleanSchema,
  lazy as lazySchema,
  number as numberSchema,
  object as objectSchema,
  string as stringSchema
} from 'yup';

import { NotificationPlatformType } from 'app/pages/Notifications/enums/notification-platform-type.enum';
import { ACCOUNT_NOTIFICATION_TYPES } from 'app/pages/Notifications/enums/notification-type.enum';
import type { NotificationInterface } from 'app/pages/Notifications/types';

const ACCOUNT_NOTIFICATIONS_WS_PATH = '/api/notifications';

type AccountNotificationEvent = Omit<NotificationInterface, 'status'>;

const notificationLinkSchema = objectSchema({
  text: stringSchema().required(),
  url: stringSchema().required()
});

const accountNotificationEventSchema = objectSchema({
  id: numberSchema().required(),
  createdAt: stringSchema().required(),
  type: stringSchema().oneOf(ACCOUNT_NOTIFICATION_TYPES).required(),
  platforms: arraySchema()
    .of(stringSchema().oneOf(Object.values(NotificationPlatformType)).required())
    .required(),
  language: stringSchema().required(),
  title: stringSchema().required(),
  description: stringSchema().required(),
  content: arraySchema()
    .of(
      lazySchema(value =>
        typeof value === 'string' ? stringSchema().required() : notificationLinkSchema.required()
      )
    )
    .required(),
  extensionImageUrl: stringSchema().required(),
  mobileImageUrl: stringSchema().required(),
  sourceUrl: stringSchema(),
  expirationDate: stringSchema(),
  isMandatory: booleanSchema(),
  accountAddresses: arraySchema().of(stringSchema().required())
});

const accountNotificationWsPayloadSchema = objectSchema({
  type: stringSchema().oneOf(['notification']).required(),
  notification: accountNotificationEventSchema.required()
});

export const buildAccountNotificationsWsUrl = (apiUrl: string) => {
  const url = new URL(ACCOUNT_NOTIFICATIONS_WS_PATH, apiUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';

  return url.href;
};

export const parseAccountNotificationWsMessage = (data: unknown): AccountNotificationEvent | null => {
  try {
    return accountNotificationWsPayloadSchema.validateSync(data, { strict: true }).notification;
  } catch {
    return null;
  }
};
