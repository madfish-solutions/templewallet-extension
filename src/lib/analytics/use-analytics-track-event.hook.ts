import { AnalyticsEventCategory } from "./analytics-event.enum";
import { useAnalyticsNetwork } from "./use-analytics-network.hook";
import { sendTrackEvent, useAnalytics } from "./use-analytics.hook";

export const useAnalyticsTrackEvent = () => {
  const { analyticsState } = useAnalytics();
  const rpc = useAnalyticsNetwork();

  return (
    event: string,
    category: AnalyticsEventCategory = AnalyticsEventCategory.General,
    properties?: object
  ) => analyticsState.enabled && sendTrackEvent(analyticsState.userId, rpc, event, category, properties);
}
