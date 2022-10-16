import fetchAdapter from '@vespaiach/axios-fetch-adapter';
import Analytics from 'analytics-node';

import { TempleSendPageEventRequest, TempleSendTrackEventRequest } from 'lib/temple/analytics-types';
import { loadChainId } from 'lib/temple/helpers';

if (!process.env.TEMPLE_WALLET_SEGMENT_WRITE_KEY) {
  throw new Error("Require a 'TEMPLE_WALLET_SEGMENT_WRITE_KEY' environment variable to be set");
}

const client = new Analytics(process.env.TEMPLE_WALLET_SEGMENT_WRITE_KEY, {
  axiosConfig: { adapter: fetchAdapter }
} as {});

export const trackEvent = async ({
  userId,
  rpc,
  event,
  category,
  properties
}: Omit<TempleSendTrackEventRequest, 'type'>) => {
  const chainId = rpc && (await loadChainId(rpc));

  client.track({
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

  client.page({
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
