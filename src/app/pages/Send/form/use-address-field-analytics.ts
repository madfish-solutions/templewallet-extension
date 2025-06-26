import { useCallback, useEffect, useRef } from 'react';

import { isDefined } from '@rnw-community/shared';
import { validate as multiNetworkValidateAddress } from '@temple-wallet/wallet-address-validator';

import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { otherNetworks } from 'lib/temple/front/other-networks';

export const useAddressFieldAnalytics = (value: string, addressFromNetworkEventName: string) => {
  const analytics = useAnalytics();
  const valueRef = useRef(value);

  const trackNetworkEvent = useCallback(
    (networkSlug?: string) =>
      void analytics.trackEvent(addressFromNetworkEventName, AnalyticsEventCategory.FormChange, {
        network: networkSlug,
        isValidAddress: isDefined(networkSlug)
      }),
    [analytics, addressFromNetworkEventName]
  );

  useEffect(() => {
    const prevValue = valueRef.current;
    valueRef.current = value;

    if (prevValue === value) return;

    const matchingOtherNetwork = value
      ? otherNetworks.find(({ slug }) => multiNetworkValidateAddress(value, slug))
      : undefined;

    if (isDefined(matchingOtherNetwork)) {
      trackNetworkEvent(matchingOtherNetwork.analyticsSlug);
    }
  }, [value, trackNetworkEvent]);

  return null;
};
