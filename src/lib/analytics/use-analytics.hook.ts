import { useCallback } from 'react';

import { AnalyticsEventCategory } from 'lib/temple/analytics-types';
import { useAB } from 'lib/temple/front';
import { ABTestGroup } from 'lib/templewallet-api';

import { useAnalyticsNetwork } from './use-analytics-network.hook';
import { sendPageEvent, sendTrackEvent, useAnalyticsState } from './use-analytics-state.hook';

export const useAnalytics = () => {
  const abGroup = useAB();
  const { analyticsState } = useAnalyticsState();
  const rpc = useAnalyticsNetwork();

  const trackEvent = useCallback(
    (
      event: string,
      category: AnalyticsEventCategory = AnalyticsEventCategory.General,
      properties?: object,
      isAnalyticsEnabled = analyticsState.enabled
    ) => isAnalyticsEnabled && sendTrackEvent(analyticsState.userId, rpc, event, category, properties),
    [analyticsState.enabled, analyticsState.userId, rpc]
  );

  const trackABEvent = useCallback(
    (event: string, category: AnalyticsEventCategory, properties?: object, isAnalyticsEnabled?: boolean) =>
      abGroup !== ABTestGroup.Unknown && trackEvent(event, category, properties, isAnalyticsEnabled),
    [abGroup, trackEvent]
  );

  const pageEvent = useCallback(
    (path: string, search: string, additionalProperties = {}) =>
      analyticsState.enabled && sendPageEvent(analyticsState.userId, rpc, path, search, additionalProperties),
    [analyticsState.enabled, analyticsState.userId, rpc]
  );

  return {
    trackEvent,
    trackABEvent,
    pageEvent
  };
};
