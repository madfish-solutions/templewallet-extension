import { AnalyticsEventCategory } from 'lib/temple/analytics-types';
import { TempleMessageType } from 'lib/temple/types';
import { assertResponse, makeIntercomRequest } from 'temple/front/intercom-client';

import { recordAction } from './action-log';
import { sanitizeValue } from './sanitize.utils';

export const sendTrackEvent = async (
  userId: string,
  chainId: string | undefined,
  event: string,
  category: AnalyticsEventCategory = AnalyticsEventCategory.General,
  properties?: Record<string, unknown>
) => {
  const sanitizedProperties: Record<string, unknown> | undefined = properties ? sanitizeValue(properties) : undefined;

  recordAction({
    event,
    category,
    timestamp: Date.now(),
    properties: sanitizedProperties
  });

  const res = await makeIntercomRequest({
    type: TempleMessageType.SendTrackEventRequest,
    userId,
    chainId,
    event,
    category,
    properties: sanitizedProperties
  });
  assertResponse(res.type === TempleMessageType.SendTrackEventResponse);
};

export const sendPageEvent = async (
  userId: string,
  chainId: string | undefined,
  path: string,
  search: string,
  additionalProperties: Record<string, unknown> = {}
) => {
  const sanitizedProperties: Record<string, unknown> = sanitizeValue(additionalProperties);

  const res = await makeIntercomRequest({
    type: TempleMessageType.SendPageEventRequest,
    userId,
    chainId,
    path,
    search,
    additionalProperties: sanitizedProperties
  });
  assertResponse(res.type === TempleMessageType.SendPageEventResponse);
};
