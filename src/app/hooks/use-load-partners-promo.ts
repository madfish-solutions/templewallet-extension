import { useEffect } from 'react';

import { useAppEnv } from 'app/env';
import { dispatch } from 'app/store';
import { loadPartnersPromoAction } from 'app/store/partners-promotion/actions';
import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { OptimalPromoVariantEnum } from 'lib/apis/optimal';
import { useTezosAccountAddress } from 'temple/front';

/**
 * Loads partners promo if it should be shown
 * @param variant If specified, will be used instead of the default value. The default value is
 * `OptimalPromoVariantEnum.Fullview` for full view and `OptimalPromoVariantEnum.Popup` for popup.
 */
export const useLoadPartnersPromo = (variant?: OptimalPromoVariantEnum) => {
  const { popup } = useAppEnv();
  const accountAddress = useTezosAccountAddress();
  const shouldShowPartnersPromoState = useShouldShowPartnersPromoSelector();

  const finalVariant = variant ?? (popup ? OptimalPromoVariantEnum.Popup : OptimalPromoVariantEnum.Fullview);

  useEffect(() => {
    if (shouldShowPartnersPromoState) {
      dispatch(
        loadPartnersPromoAction.submit({
          optimalPromoVariantEnum: finalVariant,
          accountAddress
        })
      );
    }
  }, [shouldShowPartnersPromoState, accountAddress, finalVariant]);
};
