import { ChangeEvent } from 'react';

import { useDispatch } from 'react-redux';

import { togglePartnersPromotionAction } from 'app/store/partners-promotion/actions';
import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { t } from 'lib/i18n';
import { useConfirm } from 'lib/ui/dialog';

export const usePartnersPromotionSettings = () => {
  const dispatch = useDispatch();
  const confirm = useConfirm();

  const isEnabled = useShouldShowPartnersPromoSelector();

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

  const setEnabled = (toChecked: boolean, event?: ChangeEvent<HTMLInputElement>) => {
    event?.preventDefault();

    return toChecked ? handleShowPromotion(toChecked) : handleHidePromotion(toChecked);
  };

  return { isEnabled, setEnabled };
};
