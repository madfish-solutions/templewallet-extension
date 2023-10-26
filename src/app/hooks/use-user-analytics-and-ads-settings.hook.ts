import { useEffect } from 'react';

import { WEBSITES_ANALYTICS_ENABLED } from 'lib/constants';
import { usePassiveStorage } from 'lib/temple/front/storage';

import { useShouldShowPartnersPromoSelector } from '../store/partners-promotion/selectors';
import { useAnalyticsEnabledSelector } from '../store/settings/selectors';

export const useUserAnalyticsAndAdsSettings = () => {
  const isAnalyticsEnabled = useAnalyticsEnabledSelector();
  const isAdsEnabled = useShouldShowPartnersPromoSelector();

  const [, setIsWebsitesAnalyticsEnabled] = usePassiveStorage(WEBSITES_ANALYTICS_ENABLED);

  useEffect(() => {
    const isAnalyticsAndAdsEnabled = isAnalyticsEnabled && isAdsEnabled;

    setIsWebsitesAnalyticsEnabled(isAnalyticsAndAdsEnabled);
  }, [isAnalyticsEnabled, isAdsEnabled, setIsWebsitesAnalyticsEnabled]);
};
