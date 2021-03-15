import { AnalyticsEventCategory } from "./analytics-event.enum";
import { sendTrackEvent, useAnalytics } from "./use-analytics.hook";

export const useAnalyticsTrackEvent = () => {
  const { analyticsState } = useAnalytics();

  return (
    event: string,
    category: AnalyticsEventCategory = AnalyticsEventCategory.General,
    properties?: object
  ) => analyticsState.enabled && sendTrackEvent(analyticsState.userId, event, category, properties);
}
