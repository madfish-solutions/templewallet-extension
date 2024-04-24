import { useCallback, useContext } from 'react';

import { useUserTestingGroupNameSelector } from 'app/store/ab-testing/selectors';
import { useAnalyticsEnabledSelector, useUserIdSelector } from 'app/store/settings/selectors';
import { AnalyticsEventCategory } from 'lib/temple/analytics-types';

import { CustomTezosChainIdContext } from './custom-rpc.context';
import { sendPageEvent, sendTrackEvent } from './send-events.utils';

export const useAnalytics = () => {
  const analyticsEnabled = useAnalyticsEnabledSelector();
  const userId = useUserIdSelector();
  const chainId = useContext(CustomTezosChainIdContext);
  const testGroupName = useUserTestingGroupNameSelector();

  const trackEvent = useCallback(
    (
      event: string,
      category: AnalyticsEventCategory = AnalyticsEventCategory.General,
      properties?: object,
      isAnalyticsEnabled = analyticsEnabled
    ) =>
      isAnalyticsEnabled &&
      sendTrackEvent(userId, chainId, event, category, { ...properties, abTestingCategory: testGroupName }),
    [analyticsEnabled, userId, chainId, testGroupName]
  );

  const pageEvent = useCallback(
    (path: string, search: string, additionalProperties = {}) =>
      analyticsEnabled &&
      sendPageEvent(userId, chainId, path, search, { ...additionalProperties, abTestingCategory: testGroupName }),
    [analyticsEnabled, userId, chainId, testGroupName]
  );

  return {
    trackEvent,
    pageEvent
  };
};
