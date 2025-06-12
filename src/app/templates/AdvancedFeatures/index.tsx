import React, { memo } from 'react';

import { IS_MISES_BROWSER } from 'lib/env';

import { PartnersPromotionSettings } from './partners-promotion-settings';
import { ReferralLinksSettings } from './referral-links-settings';

export const AdvancedFeatures = memo(() => {
  return (
    <div className="w-full max-w-sm mx-auto my-8">
      <PartnersPromotionSettings />

      {IS_MISES_BROWSER && <ReferralLinksSettings />}
    </div>
  );
});
