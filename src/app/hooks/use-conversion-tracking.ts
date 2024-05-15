import { useEffect } from 'react';

import axios from 'axios';

import { dispatch } from 'app/store';
import { setConversionTrackedAction } from 'app/store/conversion-tracking/conversion-actions';
import { useIsConversionTrackedSelector } from 'app/store/conversion-tracking/conversion-selectors';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { EnvVars } from 'lib/env';

function fetchConversionInformation() {
  return axios
    .get<{ linkId: string; name: string }>(EnvVars.CONVERSION_VERIFICATION_URL)
    .then(response => response.data);
}

export const useConversionTracking = () => {
  const { trackEvent } = useAnalytics();

  const isConversionTracked = useIsConversionTrackedSelector();

  useEffect(() => {
    if (!isConversionTracked) {
      fetchConversionInformation().then(({ linkId, name }) => {
        trackEvent('Conversion Info', AnalyticsEventCategory.General, {
          conversionId: linkId,
          conversionName: name
        });
      });

      dispatch(setConversionTrackedAction());
    }
  }, [trackEvent]);
};
