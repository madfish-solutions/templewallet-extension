import { useEffect, useRef } from 'react';

import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { useUserIdSelector } from 'app/store/settings/selectors';
import { performLinkingOfAdsImpressions } from 'lib/ads/link-ads-impressions';
import { ADS_IMPRESSIONS_LINKED_V2_STORAGE_KEY, MERCHANT_OFFERS_ENABLED_STORAGE_KEY } from 'lib/constants';
import { usePassiveStorage } from 'lib/temple/front/storage';
import { useUpdatableRef } from 'lib/ui/hooks';

import { useRewardsAddresses } from './use-rewards-addresses';

export const useAdsImpressionsLinking = () => {
  const adsViewerAddresses = useRewardsAddresses();
  const userId = useUserIdSelector();
  const promoEnabled = useShouldShowPartnersPromoSelector();
  const [merchantEnabled] = usePassiveStorage<boolean>(MERCHANT_OFFERS_ENABLED_STORAGE_KEY);
  const [linked, setLinked] = usePassiveStorage<boolean>(ADS_IMPRESSIONS_LINKED_V2_STORAGE_KEY);
  const runningRef = useRef(false);

  const adsViewerAddressesRef = useUpdatableRef(adsViewerAddresses);
  const userIdRef = useUpdatableRef(userId);

  const isMerchantEnabled = merchantEnabled === true;
  const eitherEnabled = promoEnabled || isMerchantEnabled;

  useEffect(() => {
    if (linked || !eitherEnabled || runningRef.current) return;

    runningRef.current = true;

    performLinkingOfAdsImpressions(adsViewerAddressesRef.current, userIdRef.current)
      .then(() => setLinked(true))
      .catch(() => {})
      .finally(() => {
        runningRef.current = false;
      });
  }, [eitherEnabled, linked, adsViewerAddressesRef, userIdRef, setLinked]);
};
