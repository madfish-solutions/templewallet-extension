import { ChangeEvent } from 'react';

import { useDispatch } from 'react-redux';

import { CaptionAlert } from 'app/atoms';
import { useDoubleRewardsEngagement } from 'app/hooks/use-double-rewards-engagement';
import { setAdsSurfacesEnabledAction, togglePartnersPromotionAction } from 'app/store/partners-promotion/actions';
import {
  useShouldShowAiChatAdsSelector,
  useShouldShowInBrowserAdsSelector,
  useShouldShowInWalletAdsSelector
} from 'app/store/partners-promotion/selectors';
import { browser } from 'lib/browser';
import {
  AI_CHATBOT_ADS_ENABLED_DOMAINS_STORAGE_KEY,
  AI_CHATBOT_ADS_NUDGE_SESSION_STORAGE_KEY,
  AI_CHATBOT_ADS_NUDGE_STATE_STORAGE_KEY,
  ADS_DISABLING_TIMESTAMPS_STORAGE_KEY
} from 'lib/constants';
import { t, T } from 'lib/i18n';
import { putToStorage, removeFromStorage } from 'lib/storage';
import { useConfirm } from 'lib/ui/dialog';

export const usePartnersPromotionSettings = () => {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const { promoState, setPromoState, multiplierActive } = useDoubleRewardsEngagement();

  const isEnabled = useShouldShowInWalletAdsSelector();
  const inBrowserEnabled = useShouldShowInBrowserAdsSelector();
  const aiChatEnabled = useShouldShowAiChatAdsSelector();

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
      description: <T id="closePartnersPromoConfirm" />,
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
      await browser.storage.session?.remove(AI_CHATBOT_ADS_NUDGE_SESSION_STORAGE_KEY);
      await putToStorage(ADS_DISABLING_TIMESTAMPS_STORAGE_KEY, {});
    }
  };

  const handleShowPromotion = async () => {
    const confirmed = await confirm({
      title: t('enablePartnersPromotionConfirm'),
      children: (
        <div className="flex flex-col gap-1 w-full text-center text-font-description text-grey-1 pt-1.5 pb-1">
          <p>
            <T id="enablePartnersPromotionDescriptionConfirm" />
          </p>
          <p>
            <T id="enablePartnersPromotionPrivacyConfirm" />
          </p>
        </div>
      ),
      confirmButtonText: t('gotIt'),
      hasCancelButton: false,
      hasCloseButton: false
    });

    if (confirmed) {
      dispatch(togglePartnersPromotionAction(true));
    }
  };

  const setEnabled = (toChecked: boolean, event?: ChangeEvent<HTMLInputElement>) => {
    event?.preventDefault();

    return toChecked ? handleShowPromotion() : handleHidePromotion();
  };

  const handleHideInBrowser = async () => {
    const confirmed = await confirm({
      title: t('disablePromoBrowsingTitle'),
      children: (
        <div className="flex flex-col gap-1 w-full">
          <CaptionAlert type="warning" message={t('disablePromoBrowsingWarning')} />
          <p className="text-center text-font-description text-grey-1 py-1">
            <T id="disablePromoSurfaceConfirm" />
          </p>
        </div>
      ),
      confirmButtonText: t('disable'),
      hasCloseButton: false
    });

    if (confirmed) {
      dispatch(setAdsSurfacesEnabledAction({ inBrowser: false }));
    }
  };

  const handleHideAiChat = async () => {
    const confirmed = await confirm({
      title: t('disablePromoAiTitle'),
      description: <T id="disablePromoSurfaceConfirm" />,
      confirmButtonText: t('disable'),
      hasCloseButton: false
    });

    if (confirmed) {
      dispatch(setAdsSurfacesEnabledAction({ aiChat: false }));
    }
  };

  const setInBrowserEnabled = (toChecked: boolean, event?: ChangeEvent<HTMLInputElement>) => {
    event?.preventDefault();

    return toChecked ? dispatch(setAdsSurfacesEnabledAction({ inBrowser: true })) : handleHideInBrowser();
  };

  const setAiChatEnabled = (toChecked: boolean, event?: ChangeEvent<HTMLInputElement>) => {
    event?.preventDefault();

    return toChecked ? dispatch(setAdsSurfacesEnabledAction({ aiChat: true })) : handleHideAiChat();
  };

  return { isEnabled, setEnabled, inBrowserEnabled, setInBrowserEnabled, aiChatEnabled, setAiChatEnabled };
};
