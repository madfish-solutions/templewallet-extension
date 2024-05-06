import { useEffect } from 'react';

import axios from 'axios';

import { dispatch } from 'app/store';
import { setConversionTrackedAction } from 'app/store/conversion-tracking/conversion-actions';
import { useIsConversionTrackedSelector } from 'app/store/conversion-tracking/conversion-selectors';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';

/* @todo move out to env variable */
const CONVERSION_VERIFICATION_URL = 'http://0.0.0.0:3000/v1/verify';

function fetchConversionInformation() {
  return axios.get<{ trackingId: string; name: string }>(CONVERSION_VERIFICATION_URL).then(response => response.data);
}

export const useConversionTracking = () => {
  const { trackEvent } = useAnalytics();

  const isConversionTracked = useIsConversionTrackedSelector();

  useEffect(() => {
    if (!isConversionTracked) {
      fetchConversionInformation().then(({ trackingId, name }) => {
        trackEvent('Conversion Info', AnalyticsEventCategory.General, {
          conversionId: trackingId,
          conversionName: name
        });
      });

      dispatch(setConversionTrackedAction());
    }
  }, [trackEvent]);
};
