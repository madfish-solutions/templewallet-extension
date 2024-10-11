import React, { memo } from 'react';

import { PartnersPromotionSettings } from './partners-promotion-settings';
import { ReferralLinksSettings } from './referral-links-settings';

export const AdvancedFeatures = memo(() => {
  return (
    <div className="w-full flex flex-col gap-4">
      <PartnersPromotionSettings />

      <ReferralLinksSettings />
    </div>
  );
});
