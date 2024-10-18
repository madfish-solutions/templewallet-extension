import React, { ChangeEvent, memo, useCallback } from 'react';

import { useDispatch } from 'react-redux';

import { togglePartnersPromotionAction } from 'app/store/partners-promotion/actions';
import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { T } from 'lib/i18n';
import { useAlert, useConfirm } from 'lib/ui/dialog';

import { EnablingSetting } from '../enabling-setting';

import { AdvancedFeaturesSelectors } from './selectors';

export const PartnersPromotionSettings = memo(() => {
  const dispatch = useDispatch();
  const alert = useAlert();
  const confirm = useConfirm();

  const shouldShowPartnersPromo = useShouldShowPartnersPromoSelector();

  const handleHidePromotion = useCallback(
    async (toChecked: boolean) => {
      const confirmed = await confirm({
        title: <T id="disableAdsModalTitle" />,
        description: <T id="disableAdsModalDescription" />,
        confirmButtonText: (
          <span className="capitalize">
            <T id="disable" />
          </span>
        ),
        hasCloseButton: false
      });

      if (confirmed) {
        dispatch(togglePartnersPromotionAction(toChecked));
      }
    },
    [confirm, dispatch]
  );

  const handleShowPromotion = useCallback(
    async (toChecked: boolean) => {
      dispatch(togglePartnersPromotionAction(toChecked));
      alert({ title: <T id="adsEnabledAlertTitle" />, description: <T id="adsEnabledAlertDescription" /> });
    },
    [alert, dispatch]
  );

  const togglePartnersPromotion = (toChecked: boolean, event: ChangeEvent<HTMLInputElement>) => {
    event?.preventDefault();

    return toChecked ? handleShowPromotion(toChecked) : handleHidePromotion(toChecked);
  };

  return (
    <EnablingSetting
      title={<T id="partnersPromoSettings" />}
      description={<T id="partnersPromoDescription" />}
      enabled={shouldShowPartnersPromo}
      onChange={togglePartnersPromotion}
      testID={AdvancedFeaturesSelectors.partnersPromotionToggle}
    />
  );
});
