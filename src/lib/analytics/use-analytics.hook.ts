import Analytics from "analytics-node";
import { nanoid } from "nanoid";

import { useLocalStorage } from "lib/temple/front/local-storage";

import { AnalyticsEventCategory, AnalyticsEventEnum } from "./analytics-event.enum";

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

  const sendTrackEvent = (
    event: string,
    category: AnalyticsEventCategory = AnalyticsEventCategory.General,
    properties?: object
  ) => {
    console.log(`${event}_${category}`);

    // client.track({
    //   userId: analyticsState.userId,
    //   event: `${event}_${category}`,
    //   properties: {
    //     ...properties,
    //     event,
    //     category
    //   },
    // });
  };

  const trackEvent = (
    event: string,
    category: AnalyticsEventCategory = AnalyticsEventCategory.General,
    properties?: object
  ) => {
    analyticsState.enabled && sendTrackEvent(event, category, properties);
  };

  const setAnalyticsEnabled = (enabled?: boolean) => {
    setAnalyticsState({ ...analyticsState, enabled });
    enabled && sendTrackEvent(AnalyticsEventEnum.AnalyticsEnabled);
  };

  return {
    analyticsEnabled: analyticsState.enabled,
    setAnalyticsEnabled,
    trackEvent,
  };
}
