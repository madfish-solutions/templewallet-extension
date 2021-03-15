import { AnalyticsEventEnum } from "./analytics-event.enum";
import { sendTrackEvent, useAnalytics } from "./use-analytics.hook";
import { useChainId } from "./use-chain-id.hook";

export const useAnalyticsSettings = () => {
  const { analyticsState, setAnalyticsState } = useAnalytics();
  const chainId = useChainId();

  const setAnalyticsEnabled = (enabled?: boolean) => {
    setAnalyticsState({ ...analyticsState, enabled });

    enabled && sendTrackEvent(analyticsState.userId, chainId, AnalyticsEventEnum.AnalyticsEnabled);
  };

  return {
    analyticsEnabled: analyticsState.enabled,
    setAnalyticsEnabled,
  };
}
