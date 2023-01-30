import { jitsuClient } from '@jitsu/sdk-js';

import { TempleSendPageEventRequest, TempleSendTrackEventRequest } from 'lib/temple/analytics-types';
import { loadChainId } from 'lib/temple/helpers';

const WRITE_KEY = process.env.TEMPLE_WALLET_JITSU_WRITE_KEY;
if (!WRITE_KEY) {
  throw new Error("Require a 'TEMPLE_WALLET_JITSU_WRITE_KEY' environment variable to be set");
}

const TRACKING_HOST = process.env.TEMPLE_WALLET_JITSU_TRACKING_HOST;
if (!TRACKING_HOST) {
  throw new Error("Require a 'TEMPLE_WALLET_JITSU_TRACKING_HOST' environment variable to be set");
}

const client = jitsuClient({
  key: WRITE_KEY,
  tracking_host: TRACKING_HOST
});

export const trackEvent = async ({
  userId,
  rpc,
  event,
  category,
  properties
}: Omit<TempleSendTrackEventRequest, 'type'>) => {
  const chainId = rpc && (await loadChainId(rpc));

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
};

export const pageEvent = async ({
  userId,
  rpc,
  path,
  search,
  additionalProperties
}: Omit<TempleSendPageEventRequest, 'type'>) => {
  const url = `${path}${search}`;
  const chainId = rpc && (await loadChainId(rpc));

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
