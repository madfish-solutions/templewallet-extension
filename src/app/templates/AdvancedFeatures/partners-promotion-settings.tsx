import React, { FC } from 'react';

import { usePartnersPromotionSettings } from 'app/hooks/use-partners-promotion-settings';
import { T } from 'lib/i18n';

import { EnablingSetting } from '../enabling-setting';

import { AdvancedFeaturesSelectors } from './selectors';

export const PartnersPromotionSettings: FC = () => {
  const { isEnabled, setEnabled } = usePartnersPromotionSettings();

  return (
    <EnablingSetting
      title={<T id="partnersPromoSettings" />}
      description={<T id="partnersPromoDescription" />}
      enabled={isEnabled}
      onChange={setEnabled}
      testID={AdvancedFeaturesSelectors.partnersPromotion}
    />
  );
};
