import { useEffect, useRef } from 'react';

import {
  useShouldShowAiChatAdsSelector,
  useShouldShowInBrowserAdsSelector,
  useShouldShowInWalletAdsSelector
} from 'app/store/partners-promotion/selectors';
import { useAnalyticsEnabledSelector, useReferralLinksEnabledSelector } from 'app/store/settings/selectors';
import { useAnalytics } from 'lib/analytics';
import {
  AI_CHATBOT_ADS_ENABLED,
  REPLACE_REFERRALS_ENABLED,
  USAGE_ANALYTICS_ENABLED,
  WEBSITES_ADS_ENABLED
} from 'lib/constants';
import { AnalyticsEventCategory } from 'lib/temple/analytics-types';
import { usePassiveStorage } from 'lib/temple/front/storage';

import { useRewardsAddresses } from './use-rewards-addresses';

export const useUserAnalyticsAndAdsSettings = () => {
  const { trackEvent } = useAnalytics();
  const isInWalletAdsEnabled = useShouldShowInWalletAdsSelector();
  const isInBrowserAdsEnabled = useShouldShowInBrowserAdsSelector();
  const isAiChatAdsEnabled = useShouldShowAiChatAdsSelector();
  const isAnalyticsEnabled = useAnalyticsEnabledSelector();
  const isReferralLinksEnabled = useReferralLinksEnabledSelector();

  const [, setWebsitesAdsEnabled] = usePassiveStorage(WEBSITES_ADS_ENABLED);
  const [, setAiChatAdsEnabled] = usePassiveStorage(AI_CHATBOT_ADS_ENABLED);
  const [, setAnalyticsEnabled] = usePassiveStorage(USAGE_ANALYTICS_ENABLED);
  const [, setIsReplaceReferralsEnabled] = usePassiveStorage(REPLACE_REFERRALS_ENABLED);

  const prevAdsEnabledRef = useRef(isInWalletAdsEnabled);
  const { tezosAddress: accountPkh } = useRewardsAddresses();

  useEffect(() => {
    setWebsitesAdsEnabled(isInBrowserAdsEnabled);
    setAiChatAdsEnabled(isAiChatAdsEnabled);
    setAnalyticsEnabled(isAnalyticsEnabled);
    setIsReplaceReferralsEnabled(isReferralLinksEnabled);

    // It happens when the wallet is not ready although `registerWallet` promise has been resolved
    if (typeof accountPkh !== 'string') {
      return;
    }

    if (isInWalletAdsEnabled && !prevAdsEnabledRef.current) {
      trackEvent('AdsEnabled', AnalyticsEventCategory.General, { accountPkh }, true);
    }

    prevAdsEnabledRef.current = isInWalletAdsEnabled;
  }, [
    isInWalletAdsEnabled,
    isInBrowserAdsEnabled,
    isAiChatAdsEnabled,
    isAnalyticsEnabled,
    isReferralLinksEnabled,
    setWebsitesAdsEnabled,
    setAiChatAdsEnabled,
    setAnalyticsEnabled,
    setIsReplaceReferralsEnabled,
    trackEvent,
    accountPkh
  ]);
};
