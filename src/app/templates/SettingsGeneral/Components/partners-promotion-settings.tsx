import React, { ChangeEvent, FC } from 'react';

import { useDispatch } from 'react-redux';

import { FormCheckbox } from 'app/atoms';
import { togglePartnersPromotionAction } from 'app/store/partners-promotion/actions';
import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { setAdsBannerVisibilityAction } from 'app/store/settings/actions';
import { useIsEnabledAdsBannerSelector } from 'app/store/settings/selectors';
import { T, t } from 'lib/i18n';
import { useConfirm } from 'lib/ui/dialog';

import { SettingsGeneralSelectors } from '../selectors';

export const PartnersPromotionSettings: FC = () => {
  const dispatch = useDispatch();
  const confirm = useConfirm();

  const shouldShowPartnersPromo = useShouldShowPartnersPromoSelector();
  const isEnableAdsBanner = useIsEnabledAdsBannerSelector();

  const handleHidePromotion = async (toChecked: boolean) => {
    const confirmed = await confirm({
      title: t('closePartnersPromotion'),
      children: t('closePartnersPromoConfirm'),
      comfirmButtonText: t('disable')
    });

    if (confirmed) {
      dispatch(togglePartnersPromotionAction(toChecked));
    }
    if (isEnableAdsBanner) {
      dispatch(setAdsBannerVisibilityAction(false));
    }
  };

  const handleShowPromotion = async (toChecked: boolean) => {
    const confirmed = await confirm({
      title: t('enablePartnersPromotionConfirm'),
      children: t('enablePartnersPromotionDescriptionConfirm'),
      comfirmButtonText: t('enable')
    });

    if (confirmed) {
      dispatch(togglePartnersPromotionAction(toChecked));
    }
    if (isEnableAdsBanner) {
      dispatch(setAdsBannerVisibilityAction(false));
    }
  };

  const togglePartnersPromotion = (toChecked: boolean, event: ChangeEvent<HTMLInputElement>) => {
    event?.preventDefault();

    return toChecked ? handleShowPromotion(toChecked) : handleHidePromotion(toChecked);
  };

  return (
    <>
      <label className="mb-4 leading-tight flex flex-col" htmlFor="shouldShowPartnersPromo">
        <span className="text-base font-semibold text-gray-700">
          <T id="partnersPromoSettings" />
        </span>

        <span className="mt-1 text-xs font-light text-gray-600" style={{ maxWidth: '90%' }}>
          <T
            id="partnersPromoDescription"
            substitutions={[
              <span className="font-semibold">
                <T id="rewards" />
              </span>
            ]}
          />
        </span>
      </label>

      <FormCheckbox
        checked={shouldShowPartnersPromo}
        onChange={togglePartnersPromotion}
        name="shouldShowPartnersPromo"
        label={t(shouldShowPartnersPromo ? 'enabled' : 'disabled')}
        containerClassName="mb-4"
        testID={SettingsGeneralSelectors.partnersPromotion}
      />
    </>
  );
};
