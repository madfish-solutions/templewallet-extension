import Analytics from 'analytics-node';

import {useStorage} from "../temple/front";
import {AnalyticsEventEnum} from "./analytics-event.enum";

interface AnalyticsStateInterface {
  enabled?: boolean,
  userId?: string,
}

const client = new Analytics(process.env.TEMPLE_WALLET_SEGMENT_WRITE_KEY ?? '');

export const useAnalytics = () => {
  const [analyticsState, setAnalyticsState] = useStorage<AnalyticsStateInterface>('analytics', {
    enabled: undefined,
    userId: undefined
  });

  const trackEvent = (event: AnalyticsEventEnum) => {
    if (analyticsState.enabled && analyticsState.userId) {
      console.log('event');

      client.track({
        event,
        userId: analyticsState.userId
      });
    }
  }

  const setAnalyticsUserId = (userId?: string) => setAnalyticsState({...analyticsState, userId});
  const setAnalyticsEnabled = (enabled?: boolean) => {
    setAnalyticsState({...analyticsState, enabled});
    enabled && trackEvent(AnalyticsEventEnum.AnalyticsEnabled);
  }

  return {
    analyticsEnabled: analyticsState.enabled,
    trackEvent,
    setAnalyticsUserId,
    setAnalyticsEnabled,
  };
}
