import { useEffect, useRef } from 'react';

import { useAnalytics } from 'lib/analytics';
import { WEBSITES_ANALYTICS_ENABLED } from 'lib/constants';
import { AnalyticsEventCategory } from 'lib/temple/analytics-types';
import { useAccountPkh } from 'lib/temple/front';
import { usePassiveStorage } from 'lib/temple/front/storage';

import { useShouldShowPartnersPromoSelector } from '../store/partners-promotion/selectors';
import { useAnalyticsEnabledSelector } from '../store/settings/selectors';

export const useUserAnalyticsAndAdsSettings = () => {
  const { trackEvent } = useAnalytics();
  const isAnalyticsEnabled = useAnalyticsEnabledSelector();
  const isAdsEnabled = useShouldShowPartnersPromoSelector();

  const [, setIsWebsitesAnalyticsEnabled] = usePassiveStorage(WEBSITES_ANALYTICS_ENABLED);
  const prevWebsiteAnalyticsEnabledRef = useRef(isAnalyticsEnabled && isAdsEnabled);
  const accountPkh = useAccountPkh();

  useEffect(() => {
    const shouldEnableAnalyticsAndAds = isAnalyticsEnabled && isAdsEnabled;

    setIsWebsitesAnalyticsEnabled(shouldEnableAnalyticsAndAds);

    if (shouldEnableAnalyticsAndAds && !prevWebsiteAnalyticsEnabledRef.current) {
      trackEvent('AnalyticsAndAdsEnabled', AnalyticsEventCategory.General, { accountPkh });
    }
    prevWebsiteAnalyticsEnabledRef.current = shouldEnableAnalyticsAndAds;
  }, [isAnalyticsEnabled, isAdsEnabled, setIsWebsitesAnalyticsEnabled, trackEvent, accountPkh]);
};
