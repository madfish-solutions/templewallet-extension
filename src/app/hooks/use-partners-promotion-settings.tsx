import { ChangeEvent } from 'react';

import { useDispatch } from 'react-redux';

import { togglePartnersPromotionAction } from 'app/store/partners-promotion/actions';
import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import {
  AI_CHATBOT_ADS_ENABLED_DOMAINS_STORAGE_KEY,
  AI_CHATBOT_ADS_NUDGE_SESSION_STORAGE_KEY,
  AI_CHATBOT_ADS_NUDGE_STATE_STORAGE_KEY
} from 'lib/constants';
import { t } from 'lib/i18n';
import { removeFromStorage } from 'lib/storage';
import { useConfirm } from 'lib/ui/dialog';

export const usePartnersPromotionSettings = () => {
  const dispatch = useDispatch();
  const confirm = useConfirm();

  const isEnabled = useShouldShowPartnersPromoSelector();

  const handleHidePromotion = async () => {
    const confirmed = await confirm({
      title: t('closePartnersPromotion'),
      description: t('closePartnersPromoConfirm'),
      confirmButtonText: t('disable'),
      hasCloseButton: false
    });

    if (confirmed) {
      dispatch(togglePartnersPromotionAction(false));
      await removeFromStorage([
        AI_CHATBOT_ADS_ENABLED_DOMAINS_STORAGE_KEY,
        AI_CHATBOT_ADS_NUDGE_SESSION_STORAGE_KEY,
        AI_CHATBOT_ADS_NUDGE_STATE_STORAGE_KEY
      ]);
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
