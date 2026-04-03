import { useEffect, useRef } from 'react';

import retry from 'async-retry';

import { useMerchantPromotionEnabledSelector } from 'app/store/merchant-promotion/selectors';
import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { useUserIdSelector } from 'app/store/settings/selectors';
import { performLinkingOfAdsImpressions } from 'lib/ads/link-ads-impressions';
import { ADS_IMPRESSIONS_LINKED_V2_STORAGE_KEY } from 'lib/constants';
import { usePassiveStorage } from 'lib/temple/front/storage';
import { useUpdatableRef } from 'lib/ui/hooks';

import { useRewardsAddresses } from './use-rewards-addresses';

export const useAdsImpressionsLinking = () => {
  const adsViewerAddresses = useRewardsAddresses();
  const userId = useUserIdSelector();
  const promoEnabled = useShouldShowPartnersPromoSelector();
  const isMerchantEnabled = useMerchantPromotionEnabledSelector();
  const [linked, setLinked] = usePassiveStorage<boolean>(ADS_IMPRESSIONS_LINKED_V2_STORAGE_KEY);
  const runningRef = useRef(false);

  const adsViewerAddressesRef = useUpdatableRef(adsViewerAddresses);
  const userIdRef = useUpdatableRef(userId);

  const eitherEnabled = promoEnabled || isMerchantEnabled;

  useEffect(() => {
    if (linked || !eitherEnabled || runningRef.current) return;

    runningRef.current = true;

    retry(() => performLinkingOfAdsImpressions(adsViewerAddressesRef.current, userIdRef.current), {
      retries: 2
    })
      .then(() => {
        setLinked(true);
      })
      .catch(err => console.warn('[AdsImpressionsLinking] Client: failed', err))
      .finally(() => {
        runningRef.current = false;
      });
  }, [eitherEnabled, linked, adsViewerAddressesRef, userIdRef, setLinked]);
};
