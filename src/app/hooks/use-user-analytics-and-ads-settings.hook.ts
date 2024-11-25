import { useEffect, useRef } from 'react';

import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { useReferralLinksEnabledSelector } from 'app/store/settings/selectors';
import { useAnalytics } from 'lib/analytics';
import { REPLACE_REFERRALS_ENABLED, WEBSITES_ANALYTICS_ENABLED } from 'lib/constants';
import { AnalyticsEventCategory } from 'lib/temple/analytics-types';
import { useAccountPkh } from 'lib/temple/front';
import { usePassiveStorage } from 'lib/temple/front/storage';

export const useUserAnalyticsAndAdsSettings = () => {
  const { trackEvent } = useAnalytics();
  const isAdsEnabled = useShouldShowPartnersPromoSelector();
  const isReferralLinksEnabled = useReferralLinksEnabledSelector();

  const [, setIsWebsitesAnalyticsEnabled] = usePassiveStorage(WEBSITES_ANALYTICS_ENABLED);
  const [, setIsReplaceReferralsEnabled] = usePassiveStorage(REPLACE_REFERRALS_ENABLED);

  const prevAdsEnabledRef = useRef(isAdsEnabled);
  const accountPkh = useAccountPkh();

  useEffect(() => {
    setIsWebsitesAnalyticsEnabled(isAdsEnabled);
    setIsReplaceReferralsEnabled(isReferralLinksEnabled);

    // It happens when the wallet is not ready although `registerWallet` promise has been resolved
    if (typeof accountPkh !== 'string') {
      return;
    }

    if (isAdsEnabled && !prevAdsEnabledRef.current) {
      trackEvent('AdsEnabled', AnalyticsEventCategory.General, { accountPkh }, true);
    }

    prevAdsEnabledRef.current = isAdsEnabled;
  }, [
    isAdsEnabled,
    isReferralLinksEnabled,
    setIsWebsitesAnalyticsEnabled,
    setIsReplaceReferralsEnabled,
    trackEvent,
    accountPkh
  ]);
};
