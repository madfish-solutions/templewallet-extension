import Analytics from "analytics-node";
import { nanoid } from "nanoid";

import { useLocalStorage } from "lib/temple/front/local-storage";

import { AnalyticsEventEnum } from "./analytics-event.enum";

interface AnalyticsStateInterface {
  enabled?: boolean,
  userId: string,
}

const client = new Analytics(process.env.TEMPLE_WALLET_SEGMENT_WRITE_KEY ?? '');

export const useAnalytics = () => {
  const [analyticsState, setAnalyticsState] = useLocalStorage<AnalyticsStateInterface>('analytics', {
    enabled: undefined,
    userId: nanoid()
  });

  const sendTrackEvent = (event: AnalyticsEventEnum) => {
    console.log({ event });

    client.track({
      event,
      userId: analyticsState.userId,
    });
  };

  const trackEvent = (event: AnalyticsEventEnum) => {
    analyticsState.enabled && sendTrackEvent(event);
  };

  const setAnalyticsEnabled = (enabled?: boolean) => {
    setAnalyticsState({ ...analyticsState, enabled });
    enabled && sendTrackEvent(AnalyticsEventEnum.AnalyticsEnabled);
  };

  return {
    analyticsEnabled: analyticsState.enabled,
    trackEvent,
    setAnalyticsEnabled,
  };
}
