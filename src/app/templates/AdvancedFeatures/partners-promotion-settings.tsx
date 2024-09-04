import React, { ChangeEvent, FC } from 'react';

import { useDispatch } from 'react-redux';

import { togglePartnersPromotionAction } from 'app/store/partners-promotion/actions';
import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { T, t } from 'lib/i18n';
import { useConfirm } from 'lib/ui/dialog';

import { EnablingSetting } from '../EnablingSetting';
import { SettingsGeneralSelectors } from '../SettingsGeneral/selectors';

export const PartnersPromotionSettings: FC = () => {
  const dispatch = useDispatch();
  const confirm = useConfirm();

  const shouldShowPartnersPromo = useShouldShowPartnersPromoSelector();

  const handleHidePromotion = async (toChecked: boolean) => {
    const confirmed = await confirm({
      title: t('closePartnersPromotion'),
      children: t('closePartnersPromoConfirm'),
      comfirmButtonText: t('disable')
    });

    if (confirmed) {
      dispatch(togglePartnersPromotionAction(toChecked));
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
  };

  const togglePartnersPromotion = (toChecked: boolean, event: ChangeEvent<HTMLInputElement>) => {
    event?.preventDefault();

    return toChecked ? handleShowPromotion(toChecked) : handleHidePromotion(toChecked);
  };

  return (
    <EnablingSetting
      titleI18nKey="partnersPromoSettings"
      descriptionI18nKey="partnersPromoDescription"
      descriptionSubstitutions={
        <span className="font-semibold">
          <T id="rewards" />
        </span>
      }
      enabled={shouldShowPartnersPromo}
      onChange={togglePartnersPromotion}
      testID={SettingsGeneralSelectors.partnersPromotion}
    />
  );
};
