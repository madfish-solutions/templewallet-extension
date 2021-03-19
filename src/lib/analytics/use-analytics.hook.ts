import { AnalyticsEventCategory } from "./analytics-event.enum";
import { useAnalyticsNetwork } from "./use-analytics-network.hook";
import { sendPageEvent, sendTrackEvent, useAnalyticsState } from "./use-analytics-state.hook";

export const useAnalytics = () => {
  const { analyticsState } = useAnalyticsState();
  const rpc = useAnalyticsNetwork();

  const trackEvent = (
    event: string,
    category: AnalyticsEventCategory = AnalyticsEventCategory.General,
    properties?: object
  ) => analyticsState.enabled && sendTrackEvent(analyticsState.userId, rpc, event, category, properties);

  const pageEvent = (
    path: string,
    search: string
  ) => analyticsState.enabled && sendPageEvent(analyticsState.userId, rpc, path, search);

  return {
    trackEvent,
    pageEvent
  };
}
