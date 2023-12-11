import { useCallback } from 'react';

import { useUserTestingGroupNameSelector } from 'app/store/ab-testing/selectors';
import { useAnalyticsEnabledSelector, useUserIdSelector } from 'app/store/settings/selectors';
import { AnalyticsEventCategory } from 'lib/temple/analytics-types';

import { sendPageEvent, sendTrackEvent } from './send-events.utils';
import { useAnalyticsNetwork } from './use-analytics-network.hook';

export const useAnalytics = () => {
  const analyticsEnabled = useAnalyticsEnabledSelector();
  const userId = useUserIdSelector();
  const rpc = useAnalyticsNetwork();
  const testGroupName = useUserTestingGroupNameSelector();

  const trackEvent = useCallback(
    (
      event: string,
      category: AnalyticsEventCategory = AnalyticsEventCategory.General,
      properties?: object,
      isAnalyticsEnabled = analyticsEnabled
    ) =>
      isAnalyticsEnabled &&
      sendTrackEvent(userId, rpc, event, category, { ...properties, abTestingCategory: testGroupName }),
    [analyticsEnabled, userId, rpc, testGroupName]
  );

  const pageEvent = useCallback(
    (path: string, search: string, additionalProperties = {}) =>
      analyticsEnabled &&
      sendPageEvent(userId, rpc, path, search, { ...additionalProperties, abTestingCategory: testGroupName }),
    [analyticsEnabled, userId, rpc, testGroupName]
  );

  return {
    trackEvent,
    pageEvent
  };
};
