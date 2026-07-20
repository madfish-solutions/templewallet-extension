import { ChangeEvent } from 'react';

import { useDispatch } from 'react-redux';

import { useDoubleRewardsEngagement } from 'app/hooks/use-double-rewards-engagement';
import { togglePartnersPromotionAction } from 'app/store/partners-promotion/actions';
import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { t } from 'lib/i18n';
import { useConfirm } from 'lib/ui/dialog';

export const usePartnersPromotionSettings = () => {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const { promoState, setPromoState, multiplierActive } = useDoubleRewardsEngagement();

  const isEnabled = useShouldShowPartnersPromoSelector();

  const handleHidePromotion = async () => {
    if (multiplierActive) {
      const confirmed = await confirm({
        title: t('doubleRewardsEngagementOptOutTitle'),
        description: t('doubleRewardsEngagementOptOutDescription'),
        confirmButtonText: t('gotIt'),
        hasCancelButton: false
      });

      if (confirmed) {
        await setPromoState({
          activatedAt: promoState!.activatedAt,
          multiplierEndedAt: promoState!.multiplierEndedAt ?? Date.now()
        });
        dispatch(togglePartnersPromotionAction(false));
      }

      return;
    }

    const confirmed = await confirm({
      title: t('closePartnersPromotion'),
      description: t('closePartnersPromoConfirm'),
      confirmButtonText: t('disable'),
      hasCloseButton: false
    });

    if (confirmed) {
      dispatch(togglePartnersPromotionAction(false));
    }
  };

  const handleShowPromotion = async () => {
    const confirmed = await confirm({
      title: t('enablePartnersPromotionConfirm'),
      description: t('enablePartnersPromotionDescriptionConfirm'),
      confirmButtonText: t('okGotIt'),
      hasCancelButton: false
    });

    if (confirmed) {
      dispatch(togglePartnersPromotionAction(true));
    }
  };

  const setEnabled = (toChecked: boolean, event?: ChangeEvent<HTMLInputElement>) => {
    event?.preventDefault();

    return toChecked ? handleShowPromotion() : handleHidePromotion();
  };

  return { isEnabled, setEnabled };
};
