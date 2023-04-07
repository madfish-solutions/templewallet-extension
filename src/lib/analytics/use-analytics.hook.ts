import { useCallback } from 'react';

import { useAnalyticsEnabledSelector, useUserIdSelector } from 'app/store/settings/selectors';
import { ABTestGroup } from 'lib/apis/temple';
import { AnalyticsEventCategory } from 'lib/temple/analytics-types';
import { useAB } from 'lib/temple/front';

import { sendPageEvent, sendTrackEvent } from './send-events.utils';
import { useAnalyticsNetwork } from './use-analytics-network.hook';

export const useAnalytics = () => {
  const abGroup = useAB();
  const analyticsEnabled = useAnalyticsEnabledSelector();
  const userId = useUserIdSelector();
  const rpc = useAnalyticsNetwork();

  const trackEvent = useCallback(
    (
      event: string,
      category: AnalyticsEventCategory = AnalyticsEventCategory.General,
      properties?: object,
      isAnalyticsEnabled = analyticsEnabled
    ) => isAnalyticsEnabled && sendTrackEvent(userId, rpc, event, category, properties),
    [analyticsEnabled, userId, rpc]
  );

  const trackABEvent = useCallback(
    (event: string, category: AnalyticsEventCategory, properties?: object, isAnalyticsEnabled?: boolean) =>
      abGroup !== ABTestGroup.Unknown && trackEvent(event, category, properties, isAnalyticsEnabled),
    [abGroup, trackEvent]
  );

  const pageEvent = useCallback(
    (path: string, search: string, additionalProperties = {}) =>
      analyticsEnabled && sendPageEvent(userId, rpc, path, search, additionalProperties),
    [analyticsEnabled, userId, rpc]
  );

  return {
    trackEvent,
    trackABEvent,
    pageEvent
  };
};
