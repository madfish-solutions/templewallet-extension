import { FC, useEffect, useRef, useState } from 'react';

import { CaptionAlert, ToggleSwitch } from 'app/atoms';
import { ActionModalButton } from 'app/atoms/action-modal';
import { CloseButton, PageModal } from 'app/atoms/PageModal';
import { InfoButton, PrivacyCell, SurfaceCell } from 'app/atoms/SettingsSurfaceCell';
import { dispatch } from 'app/store';
import { setAdsSurfacesEnabledAction } from 'app/store/partners-promotion/actions';
import { patchPersistedPartnersPromotionState } from 'app/store/partners-promotion/migrate';
import { AdvancedFeaturesSelectors } from 'app/templates/AdvancedFeatures/selectors';
import { PageModalScrollViewWithActions } from 'app/templates/page-modal-scroll-view-with-actions';
import { SurfaceInfoId, SurfaceInfoModal } from 'app/templates/promo-surface-info/surface-info-modal';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { PROMO_PRIVACY_POLICY_URL, REWARDS_ACCOUNT_DATA_STORAGE_KEY } from 'lib/constants';
import { T } from 'lib/i18n';
import { useStorage } from 'lib/temple/front/storage';
import { RewardsAddresses } from 'temple/types';

import openGiftSrc from './open-gift.png';
import { FineTuneRewardsModalSelectors } from './selectors';

interface Props {
  onClose: EmptyFn;
  opened: boolean;
  onShown: EmptyFn;
}

export const FineTuneRewardsModal: FC<Props> = ({ onClose, opened, onShown }) => {
  const [browsingEnabled, setBrowsingEnabled] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [infoSurface, setInfoSurface] = useState<SurfaceInfoId>();

  const { trackEvent } = useAnalytics();
  const [rewardsAccountData] = useStorage<RewardsAddresses>(REWARDS_ACCOUNT_DATA_STORAGE_KEY);
  const accountPkh = rewardsAccountData?.tezosAddress;
  const didEnablePromoRef = useRef(false);

  useEffect(() => {
    if (!opened || didEnablePromoRef.current) return;

    didEnablePromoRef.current = true;
    dispatch(setAdsSurfacesEnabledAction({ inWallet: true }));
    trackEvent('AdsEnabled', AnalyticsEventCategory.General, { accountPkh });
  }, [accountPkh, opened, trackEvent]);

  const handleSave = () => {
    patchPersistedPartnersPromotionState({ inBrowserAdsEnabled: browsingEnabled, aiChatAdsEnabled: aiEnabled }).finally(
      () => {
        // Changes in storage do not trigger Redux store update, so we need to dispatch the action manually.
        dispatch(setAdsSurfacesEnabledAction({ inWallet: true, inBrowser: browsingEnabled, aiChat: aiEnabled }));
        onClose();
      }
    );
  };

  useEffect(() => void (opened && onShown()), [opened, onShown]);

  return (
    <>
      <PageModal
        title="Temple Update"
        opened={opened}
        onRequestClose={onClose}
        titleRight={<CloseButton onClick={onClose} testID={FineTuneRewardsModalSelectors.closeButton} />}
      >
        <PageModalScrollViewWithActions
          actionsBoxProps={{
            children: (
              <ActionModalButton
                color="primary"
                className="w-full"
                onClick={handleSave}
                testID={FineTuneRewardsModalSelectors.saveButton}
              >
                Save & Continue
              </ActionModalButton>
            )
          }}
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex justify-center pt-2">
                <img src={openGiftSrc} alt="" className="w-22.5 h-29 object-contain" />
              </div>

              <div className="flex flex-col gap-1 text-center">
                <h3 className="text-font-h3">TKEY rewards for all</h3>
                <p className="text-font-description text-grey-1">
                  We turned wallet usage into earning with Promo rewards and it's now active in your wallet. See
                  sponsored content and earn TKEY by doing what you already do.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <CaptionAlert
                type="info"
                title="How it works?"
                message="20% of eligible revenue from sponsored content goes to you. Payouts are in TKEY token and fully automated - no extra steps."
              />

              <div className="flex flex-col gap-1">
                <p className="py-1 text-font-description-bold">Where you earn</p>

                <div className="rounded-lg border-0.5 border-lines overflow-hidden mb-4">
                  <div className="rounded-lg bg-white shadow-bottom">
                    <SurfaceCell
                      title={<T id="promoInWallet" />}
                      titleHint="(by default)"
                      description={<T id="promoInWalletDescription" />}
                      isLast={false}
                    >
                      <InfoButton
                        onClick={() => setInfoSurface('in-wallet')}
                        testID={FineTuneRewardsModalSelectors.inWalletInfoButton}
                      />
                    </SurfaceCell>

                    <SurfaceCell
                      title={<T id="promoWhileBrowsing" />}
                      titleHint="(optional)"
                      description={<T id="promoWhileBrowsingModalDescription" />}
                      isLast={false}
                    >
                      <InfoButton
                        onClick={() => setInfoSurface('browsing')}
                        testID={FineTuneRewardsModalSelectors.browsingInfoButton}
                      />
                      <ToggleSwitch
                        small
                        checked={browsingEnabled}
                        onChange={setBrowsingEnabled}
                        testID={AdvancedFeaturesSelectors.promoBrowser}
                      />
                    </SurfaceCell>

                    <SurfaceCell
                      title={<T id="promoWhileUsingAi" />}
                      titleHint="(optional)"
                      description={<T id="promoWhileUsingAiDescription" />}
                    >
                      <InfoButton
                        onClick={() => setInfoSurface('ai')}
                        testID={FineTuneRewardsModalSelectors.aiInfoButton}
                      />
                      <ToggleSwitch
                        small
                        checked={aiEnabled}
                        onChange={setAiEnabled}
                        testID={AdvancedFeaturesSelectors.promoAiWebchat}
                      />
                    </SurfaceCell>
                  </div>

                  <PrivacyCell
                    title="Privacy"
                    description="Your IP helps us surface relevant content and commission rate for your region and public wallet address collected for automatic reward payouts."
                    href={PROMO_PRIVACY_POLICY_URL}
                    testID={FineTuneRewardsModalSelectors.privacyLink}
                    isLast={false}
                  />

                  <SurfaceCell
                    title="Manage your experience"
                    titleBold={false}
                    description="Change your choices anytime in Settings → Advanced Features."
                  />
                </div>
              </div>
            </div>
          </div>
        </PageModalScrollViewWithActions>
      </PageModal>

      {infoSurface && (
        <SurfaceInfoModal
          surface={infoSurface}
          onClose={() => setInfoSurface(undefined)}
          closeButtonTestID={FineTuneRewardsModalSelectors.infoModalCloseButton}
          gotItButtonTestID={FineTuneRewardsModalSelectors.infoModalGotItButton}
          privacyLinkTestID={FineTuneRewardsModalSelectors.infoModalPrivacyLink}
        />
      )}
    </>
  );
};
