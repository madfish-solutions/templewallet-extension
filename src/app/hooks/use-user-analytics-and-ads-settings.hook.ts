import { useEffect, useRef } from 'react';

import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { useAnalyticsEnabledSelector, useReferralLinksEnabledSelector } from 'app/store/settings/selectors';
import { useAnalytics } from 'lib/analytics';
import { REPLACE_REFERRALS_ENABLED, USAGE_ANALYTICS_ENABLED, WEBSITES_ADS_ENABLED } from 'lib/constants';
import { AnalyticsEventCategory } from 'lib/temple/analytics-types';
import { usePassiveStorage } from 'lib/temple/front/storage';

import { useRewardsAddresses } from './use-rewards-addresses';

export const useUserAnalyticsAndAdsSettings = () => {
  const { trackEvent } = useAnalytics();
  const isAdsEnabled = useShouldShowPartnersPromoSelector();
  const isAnalyticsEnabled = useAnalyticsEnabledSelector();
  const isReferralLinksEnabled = useReferralLinksEnabledSelector();

  const [, setWebsitesAdsEnabled] = usePassiveStorage(WEBSITES_ADS_ENABLED);
  const [, setAnalyticsEnabled] = usePassiveStorage(USAGE_ANALYTICS_ENABLED);
  const [, setIsReplaceReferralsEnabled] = usePassiveStorage(REPLACE_REFERRALS_ENABLED);

  const prevAdsEnabledRef = useRef(isAdsEnabled);
  const { tezosAddress: accountPkh } = useRewardsAddresses();

  useEffect(() => {
    setWebsitesAdsEnabled(isAdsEnabled);
    setAnalyticsEnabled(isAnalyticsEnabled);
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
    isAnalyticsEnabled,
    isReferralLinksEnabled,
    setWebsitesAdsEnabled,
    setAnalyticsEnabled,
    setIsReplaceReferralsEnabled,
    trackEvent,
    accountPkh
  ]);
};
