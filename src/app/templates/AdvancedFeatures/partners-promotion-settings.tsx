import React, { FC, useState } from 'react';

import { ToggleSwitch } from 'app/atoms';
import { SettingsCellSingle } from 'app/atoms/SettingsCell';
import { InfoButton, PrivacyCell, SurfaceCell } from 'app/atoms/SettingsSurfaceCell';
import { usePartnersPromotionSettings } from 'app/hooks/use-partners-promotion-settings';
import { PROMO_PRIVACY_POLICY_URL } from 'lib/constants';
import { T } from 'lib/i18n';

import { EnablingSetting } from '../enabling-setting';
import { SurfaceInfoId, SurfaceInfoModal } from '../promo-surface-info/surface-info-modal';

import { AdvancedFeaturesSelectors } from './selectors';

export const PartnersPromotionSettings: FC = () => {
  const { isEnabled, setEnabled, inBrowserEnabled, setInBrowserEnabled, aiChatEnabled, setAiChatEnabled } =
    usePartnersPromotionSettings();
  const [infoSurface, setInfoSurface] = useState<SurfaceInfoId>();

  return (
    <>
      <EnablingSetting
        title={<T id="partnersPromoSettings" />}
        description={<T id="partnersPromoDescription" />}
        enabled={isEnabled}
        onChange={setEnabled}
        testID={AdvancedFeaturesSelectors.promo}
      >
        {isEnabled && (
          <>
            <SettingsCellSingle
              Component="div"
              isLast={false}
              cellName={<T id="promoYoureInControl" />}
              cellNameClassName="text-font-description-bold"
            >
              {null}
            </SettingsCellSingle>

            <SurfaceCell
              title={<T id="promoWhileBrowsing" />}
              titleBold={false}
              description={<T id="promoWhileBrowsingDescription" />}
              isLast={false}
            >
              <InfoButton
                onClick={() => setInfoSurface('browsing')}
                testID={AdvancedFeaturesSelectors.promoBrowsingInfoButton}
              />
              <ToggleSwitch
                small
                checked={inBrowserEnabled}
                onChange={setInBrowserEnabled}
                testID={AdvancedFeaturesSelectors.promoBrowser}
              />
            </SurfaceCell>

            <SurfaceCell
              title={<T id="promoWhileUsingAi" />}
              titleBold={false}
              description={<T id="promoWhileUsingAiDescription" />}
              isLast={false}
            >
              <InfoButton onClick={() => setInfoSurface('ai')} testID={AdvancedFeaturesSelectors.promoAiInfoButton} />
              <ToggleSwitch
                small
                checked={aiChatEnabled}
                onChange={setAiChatEnabled}
                testID={AdvancedFeaturesSelectors.promoAiWebchat}
              />
            </SurfaceCell>

            <PrivacyCell
              title={<T id="promoPrivacy" />}
              description={<T id="promoPrivacyDescription" />}
              href={PROMO_PRIVACY_POLICY_URL}
              testID={AdvancedFeaturesSelectors.promoPrivacyLink}
            />
          </>
        )}
      </EnablingSetting>

      {infoSurface && (
        <SurfaceInfoModal
          surface={infoSurface}
          onClose={() => setInfoSurface(undefined)}
          closeButtonTestID={AdvancedFeaturesSelectors.promoInfoModalCloseButton}
          gotItButtonTestID={AdvancedFeaturesSelectors.promoInfoModalGotItButton}
          privacyLinkTestID={AdvancedFeaturesSelectors.promoInfoModalPrivacyLink}
        />
      )}
    </>
  );
};
