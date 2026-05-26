import React, { memo } from 'react';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { T } from 'lib/i18n';
import { IS_MISES_BROWSER } from 'lib/env';

import { PartnersPromotionSettings } from './partners-promotion-settings';
import { ReferralLinksSettings } from './referral-links-settings';
import { TokenInsightSettings } from './token-insight-settings';

export const AdvancedFeatures = memo(() => {
  return (
    <FadeTransition>
      <div className="w-full flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-font-description-bold p-1">
            <T id="templeRewards" />
          </p>

          <PartnersPromotionSettings />
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-font-description-bold p-1">
            <T id="webWidgets" />
          </p>

          <TokenInsightSettings />
        </div>

        {IS_MISES_BROWSER && <ReferralLinksSettings />}
      </div>
    </FadeTransition>
  );
});
