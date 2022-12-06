import React, { FC } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useAppEnv } from 'app/env';
import { useActivePromotionSelector } from 'app/store/advertising/selectors';
import { useAnalytics } from 'lib/analytics';
import { AnalyticsEventCategory } from 'lib/temple/analytics-types';

export const AdvertisingBanner: FC = () => {
  const activePromotion = useActivePromotionSelector();
  const { popup } = useAppEnv();
  const { trackEvent } = useAnalytics();

  return isDefined(activePromotion) ? (
    <a
      className="flex items-center justify-center mr-3"
      style={{
        height: 28,
        paddingLeft: popup ? 4 : 8,
        paddingRight: popup ? 4 : 8,
        borderRadius: 4,
        backgroundColor: '#E5F2FF'
      }}
      href={activePromotion.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        trackEvent(`${activePromotion?.name}_${popup ? 'POPUP' : 'FULLPAGE'}_LOGO`, AnalyticsEventCategory.ButtonPress)
      }
    >
      <img alt={activePromotion.name} src={popup ? activePromotion.popupLogoUrl : activePromotion.fullPageLogoUrl} />
    </a>
  ) : null;
};
