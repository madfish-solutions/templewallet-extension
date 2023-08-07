import { useEffect } from 'react';

import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { getLocalStorageUsageDetails } from 'lib/local-storage';

export const useStorageAnalytics = () => {
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    trackEvent('STORAGES_STATE', AnalyticsEventCategory.General, {
      localStorage: getLocalStorageUsageDetails()
    });
  }, [trackEvent]);
};
