import React, { memo, useCallback } from 'react';

import { dispatch } from 'app/store';
import { setMerchantPromotionEnabledAction } from 'app/store/merchant-promotion/actions';
import { useMerchantPromotionEnabledSelector } from 'app/store/merchant-promotion/selectors';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { T } from 'lib/i18n';

import { EnablingSetting } from '../enabling-setting';

import { AdvancedFeaturesSelectors } from './selectors';

export const MerchantOffersSettings = memo(() => {
  const isEnabled = useMerchantPromotionEnabledSelector();
  const { trackEvent } = useAnalytics();

  const handleChange = useCallback(
    (toChecked: boolean) => {
      dispatch(setMerchantPromotionEnabledAction(toChecked));
      trackEvent(
        toChecked ? 'MerchantOffersSettingsEnabled' : 'MerchantOffersSettingsDisabled',
        AnalyticsEventCategory.CheckboxChange,
        { toChecked }
      );
    },
    [trackEvent]
  );

  return (
    <EnablingSetting
      title={<T id="merchantOffers" />}
      description={<T id="merchantOffersDescription" />}
      enabled={isEnabled}
      onChange={handleChange}
      testID={AdvancedFeaturesSelectors.merchantOffers}
    />
  );
});
