import { useCallback, useEffect, useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { isDomainNameValid, useTezosDomainsClient, validateRecipient } from 'lib/temple/front';
import { otherNetworks } from 'lib/temple/front/other-networks';

export const useAddressFieldAnalytics = (value: string, addressFromNetworkEventName: string) => {
  const analytics = useAnalytics();
  const valueRef = useRef(value);
  const domainsClient = useTezosDomainsClient();

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

    if (prevValue === value) {
      return;
    }

    validateRecipient(value, domainsClient)
      .then(result => {
        if (
          result === false ||
          (result === true && domainsClient.isSupported && isDomainNameValid(value, domainsClient))
        ) {
          return;
        }

        if (result === true) {
          trackNetworkEvent('tezos');

          return;
        }

        const matchingOtherNetwork = otherNetworks.find(({ name }) => result.includes(name));
        if (isDefined(matchingOtherNetwork)) {
          trackNetworkEvent(matchingOtherNetwork.analyticsSlug);
        }
      })
      .catch(console.error);
  }, [value, domainsClient, trackNetworkEvent]);

  const onBlur = useCallback(async () => {
    const currentValue = valueRef.current;

    validateRecipient(currentValue, domainsClient)
      .then(result => {
        if (typeof result === 'boolean') {
          return;
        }

        const matchingOtherNetwork = otherNetworks.find(({ name }) => result.includes(name));
        if (!isDefined(matchingOtherNetwork)) {
          trackNetworkEvent(undefined);
        }
      })
      .catch(console.error);
  }, [domainsClient, trackNetworkEvent]);

  return { onBlur };
};
