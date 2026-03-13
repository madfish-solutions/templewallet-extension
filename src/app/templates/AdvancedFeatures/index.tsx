import React, { memo } from 'react';

import { FadeTransition } from 'app/a11y/FadeTransition';

import { MerchantOffersSettings } from './merchant-offers-settings';
import { PartnersPromotionSettings } from './partners-promotion-settings';

export const AdvancedFeatures = memo(() => {
  return (
    <FadeTransition>
      <div className="w-full flex flex-col gap-4">
        <PartnersPromotionSettings />

        <MerchantOffersSettings />
      </div>
    </FadeTransition>
  );
});
