import React, { FC } from 'react';

import { usePartnersPromotionSettings } from 'app/hooks/use-partners-promotion-settings';
import { T } from 'lib/i18n';

import { EnablingSetting } from '../EnablingSetting';
import { SettingsGeneralSelectors } from '../SettingsGeneral/selectors';

export const PartnersPromotionSettings: FC = () => {
  const { isEnabled, setEnabled } = usePartnersPromotionSettings();

  return (
    <EnablingSetting
      titleI18nKey="partnersPromoSettings"
      descriptionI18nKey="partnersPromoDescription"
      descriptionSubstitutions={
        <span className="font-semibold">
          <T id="rewards" />
        </span>
      }
      enabled={isEnabled}
      onChange={setEnabled}
      testID={SettingsGeneralSelectors.partnersPromotion}
    />
  );
};
