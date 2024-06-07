import { useEffect, useRef } from 'react';

import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { useAnalyticsEnabledSelector } from 'app/store/settings/selectors';
import { useAnalytics } from 'lib/analytics';
import { WEBSITES_ANALYTICS_ENABLED } from 'lib/constants';
import { AnalyticsEventCategory } from 'lib/temple/analytics-types';
import { useAccountPkh } from 'lib/temple/front';
import { usePassiveStorage } from 'lib/temple/front/storage';

export const useUserAnalyticsAndAdsSettings = () => {
  const { trackEvent } = useAnalytics();
  const isAnalyticsEnabled = useAnalyticsEnabledSelector();
  const isAdsEnabled = useShouldShowPartnersPromoSelector();

  const [, setIsWebsitesAnalyticsEnabled] = usePassiveStorage(WEBSITES_ANALYTICS_ENABLED);
  const prevWebsiteAnalyticsEnabledRef = useRef(isAdsEnabled);
  const accountPkh = useAccountPkh();

  useEffect(() => {
    setIsWebsitesAnalyticsEnabled(isAdsEnabled);

    // It happens when the wallet is not ready although `registerWallet` promise has been resolved
    if (typeof accountPkh !== 'string') {
      prevWebsiteAnalyticsEnabledRef.current = isAdsEnabled;

      return;
    }

    if (isAdsEnabled && !prevWebsiteAnalyticsEnabledRef.current) {
      trackEvent('AdsEnabled', AnalyticsEventCategory.General, { accountPkh }, true);
    }
  }, [isAdsEnabled, setIsWebsitesAnalyticsEnabled, trackEvent, accountPkh, isAnalyticsEnabled]);
};
