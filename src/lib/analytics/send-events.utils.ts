import { AnalyticsEventCategory } from 'lib/temple/analytics-types';
import { TempleMessageType } from 'lib/temple/types';
import { assertResponse, makeIntercomRequest } from 'temple/front/intercom-client';

export const sendTrackEvent = async (
  userId: string,
  chainId: string | undefined,
  event: string,
  category: AnalyticsEventCategory = AnalyticsEventCategory.General,
  properties?: object
) => {
  const res = await makeIntercomRequest({
    type: TempleMessageType.SendTrackEventRequest,
    userId,
    chainId,
    event,
    category,
    properties
  });
  assertResponse(res.type === TempleMessageType.SendTrackEventResponse);
};

export const sendPageEvent = async (
  userId: string,
  chainId: string | undefined,
  path: string,
  search: string,
  additionalProperties = {}
) => {
  const res = await makeIntercomRequest({
    type: TempleMessageType.SendPageEventRequest,
    userId,
    chainId,
    path,
    search,
    additionalProperties
  });
  assertResponse(res.type === TempleMessageType.SendPageEventResponse);
};
