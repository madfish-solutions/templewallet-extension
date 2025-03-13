import React, { memo } from 'react';

import { FadeTransition } from 'app/a11y/FadeTransition';

import { PartnersPromotionSettings } from './partners-promotion-settings';
import { ReferralLinksSettings } from './referral-links-settings';

export const AdvancedFeatures = memo(() => {
  return (
    <FadeTransition>
      <div className="w-full flex flex-col gap-4">
        <PartnersPromotionSettings />

        <ReferralLinksSettings />
      </div>
    </FadeTransition>
  );
});
