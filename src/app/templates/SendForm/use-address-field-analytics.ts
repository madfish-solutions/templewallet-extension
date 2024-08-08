import { useCallback, useEffect, useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { validateRecipient } from 'lib/temple/front';
import { otherNetworks } from 'lib/temple/front/other-networks';
import { isTezosDomainsNameValid, getTezosDomainsClient } from 'temple/front/tezos';
import { TezosNetworkEssentials } from 'temple/networks';

export const useAddressFieldAnalytics = (
  network: TezosNetworkEssentials,
  value: string,
  addressFromNetworkEventName: string
) => {
  const analytics = useAnalytics();
  const valueRef = useRef(value);
  const domainsClient = getTezosDomainsClient(network.chainId, network.rpcBaseURL);

  const trackNetworkEvent = useCallback(
    (networkSlug?: string) =>
      void analytics.trackEvent(addressFromNetworkEventName, AnalyticsEventCategory.FormChange, {
        network: networkSlug,
        isValidAddress: isDefined(networkSlug)
      }),
    [analytics.trackEvent, addressFromNetworkEventName]
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
          (result === true && domainsClient.isSupported && isTezosDomainsNameValid(value, domainsClient))
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
