import { dispatch } from 'app/store';
import { setAdsImpressionsLinkedAction } from 'app/store/settings/actions';
import { useIsAdsImpressionsLinkedSelector, useUserIdSelector } from 'app/store/settings/selectors';
import { performLinkingOfAdsImpressions } from 'lib/ads/link-ads-impressions';
import { useDidMount } from 'lib/ui/hooks';

import { useRewardsAddresses } from './use-rewards-addresses';

export const useAdsImpressionsLinking = () => {
  const linked = useIsAdsImpressionsLinkedSelector();
  const adsViewerAddresses = useRewardsAddresses();
  const userId = useUserIdSelector();

  useDidMount(() => {
    if (linked) return;

    performLinkingOfAdsImpressions(adsViewerAddresses, userId)
      .then(() => void dispatch(setAdsImpressionsLinkedAction()))
      .catch(() => {});
  });
};
