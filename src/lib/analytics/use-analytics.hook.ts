import { useCallback } from 'react';

import { useAnalyticsEnabledSelector, useUserIdSelector } from 'app/store/settings/selectors';
import { AnalyticsEventCategory } from 'lib/temple/analytics-types';

import { useUserTestingGroupNameSelector } from '../../app/store/ab-testing/selectors';
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
      sendTrackEvent(userId, rpc, event, category, { ...properties, ABTestingCategory: testGroupName }),
    [analyticsEnabled, userId, rpc]
  );

  const pageEvent = useCallback(
    (path: string, search: string, additionalProperties = {}) =>
      analyticsEnabled &&
      sendPageEvent(userId, rpc, path, search, { ...additionalProperties, ABTestingCategory: testGroupName }),
    [analyticsEnabled, userId, rpc]
  );

  return {
    trackEvent,
    pageEvent
  };
};
