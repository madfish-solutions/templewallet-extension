import { AnalyticsEventCategory } from "./analytics-event.enum";
import { sendTrackEvent, useAnalytics } from "./use-analytics.hook";
import { useChainId } from "./use-chain-id.hook";

export const useAnalyticsTrackEvent = () => {
  const { analyticsState } = useAnalytics();
  const chainId = useChainId();

  return (
    event: string,
    category: AnalyticsEventCategory = AnalyticsEventCategory.General,
    properties?: object
  ) => analyticsState.enabled && sendTrackEvent(analyticsState.userId, chainId, event, category, properties);
}
