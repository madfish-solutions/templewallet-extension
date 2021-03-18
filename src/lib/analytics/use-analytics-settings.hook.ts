import { AnalyticsEventEnum } from "./analytics-event.enum";
import { useAnalyticsNetwork } from "./use-analytics-network.hook";
import { sendTrackEvent, useAnalytics } from "./use-analytics.hook";

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
