import { AnalyticsEventEnum } from "./analytics-event.enum";
import { sendTrackEvent, useAnalytics } from "./use-analytics.hook";

export const useAnalyticsSettings = () => {
  const { analyticsState, setAnalyticsState } = useAnalytics();

  const setAnalyticsEnabled = (enabled?: boolean) => {
    setAnalyticsState({ ...analyticsState, enabled });

    enabled && sendTrackEvent(analyticsState.userId, AnalyticsEventEnum.AnalyticsEnabled);
  };

  return {
    analyticsEnabled: analyticsState.enabled,
    setAnalyticsEnabled,
  };
}
