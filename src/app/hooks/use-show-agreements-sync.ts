import { useEffect } from 'react';

import { dispatch } from 'app/store';
import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { setPendingReactivateAdsAction, setShouldShowTermsOfUseUpdateOverlayAction } from 'app/store/settings/actions';
import { useShowAgreementsCounterSelector } from 'app/store/settings/selectors';
import { MAX_SHOW_AGREEMENTS_COUNTER } from 'lib/constants';

export const useShowAgreementsSync = () => {
  const showAgreementsCounter = useShowAgreementsCounterSelector();
  const shouldShowPartnersPromo = useShouldShowPartnersPromoSelector();

  useEffect(() => {
    const shouldShowAgreements = showAgreementsCounter < MAX_SHOW_AGREEMENTS_COUNTER;
    dispatch(setShouldShowTermsOfUseUpdateOverlayAction(shouldShowAgreements));
    if (shouldShowAgreements && !shouldShowPartnersPromo) {
      dispatch(setPendingReactivateAdsAction(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
