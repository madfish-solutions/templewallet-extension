import { nanoid } from 'nanoid';

import { AnalyticsEventCategory } from 'lib/temple/analytics-types';
import { useLocalStorage } from 'lib/temple/front/local-storage';

import { assertResponse, request } from '../temple/front';
import { TempleMessageType } from '../temple/types';

interface AnalyticsStateInterface {
  enabled?: boolean;
  userId: string;
}

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

export const useAnalyticsState = () => {
  const [analyticsState, setAnalyticsState] = useLocalStorage<AnalyticsStateInterface>('analytics', {
    enabled: undefined,
    userId: nanoid()
  });

  return {
    analyticsState,
    setAnalyticsState
  };
};
