import { jitsuClient } from '@jitsu/sdk-js/packages/javascript-sdk';

import { EnvVars } from 'lib/env';
import { TempleSendPageEventRequest, TempleSendTrackEventRequest } from 'lib/temple/analytics-types';

const { TEMPLE_WALLET_JITSU_WRITE_KEY: WRITE_KEY, TEMPLE_WALLET_JITSU_TRACKING_HOST: TRACKING_HOST } = EnvVars;

export const client = jitsuClient({
  key: WRITE_KEY,
  tracking_host: TRACKING_HOST
});

export const trackEvent = async ({
  userId,
  chainId,
  event,
  category,
  properties
}: Omit<TempleSendTrackEventRequest, 'type'>) =>
  client.track(`${category} ${event}`, {
    userId,
    event: `${category} ${event}`,
    timestamp: new Date(),
    properties: {
      ...properties,
      event,
      category,
      chainId
    }
  });

export const pageEvent = async ({
  userId,
  chainId,
  path,
  search,
  additionalProperties
}: Omit<TempleSendPageEventRequest, 'type'>) => {
  const url = `${path}${search}`;

  client.track('AnalyticsEventCategory.PageOpened', {
    userId,
    name: path,
    timestamp: new Date(),
    category: 'AnalyticsEventCategory.PageOpened',
    properties: {
      url,
      path: search,
      referrer: path,
      category: 'AnalyticsEventCategory.PageOpened',
      chainId,
      ...additionalProperties
    }
  });
};
