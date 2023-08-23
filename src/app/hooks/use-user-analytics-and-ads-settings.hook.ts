import { useEffect } from 'react';

import { usePassiveStorage } from '../../lib/temple/front/storage';
import { useShouldShowPartnersPromoSelector } from '../store/partners-promotion/selectors';
import { useAnalyticsEnabledSelector } from '../store/settings/selectors';

const WEBSITES_ANALYTICS_ENABLED = 'WEBSITES_ANALYTICS_ENABLED';

export const useUserAnalyticsAndAdsSettings = () => {
  const isAnalyticsEnabled = useAnalyticsEnabledSelector();
  const isAdsEnabled = useShouldShowPartnersPromoSelector();

  const [, setIsWebsitesAnalyticsEnebled] = usePassiveStorage(WEBSITES_ANALYTICS_ENABLED);

  useEffect(() => {
    const isAnalyticsAndAdsEnabled = isAnalyticsEnabled && isAdsEnabled;

    setIsWebsitesAnalyticsEnebled(isAnalyticsAndAdsEnabled);
  }, [isAnalyticsEnabled, isAdsEnabled, setIsWebsitesAnalyticsEnebled]);
};
