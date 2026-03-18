import React, { memo, useCallback } from 'react';

import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { MERCHANT_OFFERS_ENABLED_STORAGE_KEY } from 'lib/constants';
import { T } from 'lib/i18n';
import { usePassiveStorage } from 'lib/temple/front/storage';

import { EnablingSetting } from '../enabling-setting';

import { AdvancedFeaturesSelectors } from './selectors';

export const MerchantOffersSettings = memo(() => {
  const [isEnabled, setIsEnabled] = usePassiveStorage<boolean>(MERCHANT_OFFERS_ENABLED_STORAGE_KEY);
  const { trackEvent } = useAnalytics();

  const handleChange = useCallback(
    (toChecked: boolean) => {
      setIsEnabled(toChecked);
      trackEvent(
        toChecked ? 'MerchantOffersSettingsEnabled' : 'MerchantOffersSettingsDisabled',
        AnalyticsEventCategory.CheckboxChange,
        { toChecked }
      );
    },
    [setIsEnabled, trackEvent]
  );

  return (
    <EnablingSetting
      title={<T id="merchantOffers" />}
      description={<T id="merchantOffersDescription" />}
      enabled={isEnabled ?? true}
      onChange={handleChange}
      testID={AdvancedFeaturesSelectors.merchantOffers}
    />
  );
});
