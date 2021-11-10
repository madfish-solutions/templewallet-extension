import { useAnalyticsNetwork } from "./use-analytics-network.hook";
import { useAnalyticsState } from "./use-analytics-state.hook";

export const useAnalyticsSettings = () => {
  const { analyticsState, setAnalyticsState } = useAnalyticsState();
  const rpc = useAnalyticsNetwork();

  const setAnalyticsEnabled = (enabled?: boolean) => {
    setAnalyticsState({ ...analyticsState, enabled });
  };

  return {
    analyticsEnabled: analyticsState.enabled,
    setAnalyticsEnabled,
  };
};
