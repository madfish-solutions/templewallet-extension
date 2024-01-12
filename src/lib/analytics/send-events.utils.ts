import { AnalyticsEventCategory } from 'lib/temple/analytics-types';
import { assertResponse, request } from 'lib/temple/front/client';
import { TempleMessageType } from 'lib/temple/types';

export const sendTrackEvent = async (
  userId: string,
  rpc: string | undefined,
  event: string,
  category: AnalyticsEventCategory = AnalyticsEventCategory.General,
  properties?: object
) => {
  const res = await request({
    type: TempleMessageType.SendTrackEventRequest,
    userId,
    rpc,
    event,
    category,
    properties
  });
  assertResponse(res.type === TempleMessageType.SendTrackEventResponse);
};

export const sendPageEvent = async (
  userId: string,
  rpc: string | undefined,
  path: string,
  search: string,
  additionalProperties = {}
) => {
  const res = await request({
    type: TempleMessageType.SendPageEventRequest,
    userId,
    rpc,
    path,
    search,
    additionalProperties
  });
  assertResponse(res.type === TempleMessageType.SendPageEventResponse);
};
