import { AnalyticsEventEnum } from "./analytics-event.enum";
import { sendTrackEvent, useAnalytics } from "./use-analytics.hook";
import { useAnalyticsNetwork } from "./use-analytics-network.hook";

export const useAnalyticsSettings = () => {
  const { analyticsState, setAnalyticsState } = useAnalytics();
  const rpc = useAnalyticsNetwork();

  const setAnalyticsEnabled = (enabled?: boolean) => {
    setAnalyticsState({ ...analyticsState, enabled });

    enabled && sendTrackEvent(analyticsState.userId, rpc, AnalyticsEventEnum.AnalyticsEnabled);
  };

  return {
    analyticsEnabled: analyticsState.enabled,
    setAnalyticsEnabled,
  };
}
