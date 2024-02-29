import React, { memo, useEffect, useRef, useCallback } from 'react';

import { PersonaAdSDK } from '@personaxyz/ad-sdk';
import clsx from 'clsx';
import memoizee from 'memoizee';

import { useAdRectObservation } from 'app/hooks/ads/use-ad-rect-observation';
import { AdsProviderTitle } from 'lib/ads';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { EnvVars } from 'lib/env';

import { PartnersPromotionSelectors } from '../../selectors';
import { PartnersPromotionVariant, SingleProviderPromotionProps } from '../../types';
import { buildAdClickAnalyticsProperties } from '../../utils';

import ModStyles from './styles.module.css';

interface Props extends Omit<SingleProviderPromotionProps, 'variant'> {
  id: string;
  className?: string;
}

export const PersonaPromotion = memo<Props>(
  ({ id, className, isVisible, pageName, onReady, onError, onAdRectSeen }) => {
    const containerId = `persona-ad-${id}`;

    const ref = useRef<HTMLDivElement>(null);

    const { trackEvent } = useAnalytics();

    const onClick = useCallback(() => {
      const anchorElem = ref.current?.querySelector<HTMLAnchorElement>('a.persona-product');
      const href = anchorElem?.href;
      console.log('Href:', href);

      if (!href) {
        console.error('Persona ad href not found');
        return;
      }

      trackEvent(
        PartnersPromotionSelectors.promoLink,
        AnalyticsEventCategory.LinkPress,
        buildAdClickAnalyticsProperties(PartnersPromotionVariant.Image, AdsProviderTitle.Persona, pageName, href)
      );
    }, [trackEvent, pageName]);

    useAdRectObservation(ref, onAdRectSeen, isVisible);

    useEffect(() => {
      const { client, adUnitId } = getPersonaAdClient();

      client
        // @ts-expect-error // for missung `adConfig` prop
        .showBannerAd({ adUnitId, containerId }, errorMsg => {
          console.error('Persona ad error:', errorMsg);
          onError();
        })
        .then(onReady);
    }, [containerId, onReady, onError]);

    return (
      <div
        ref={ref}
        id={containerId}
        onClick={onClick}
        className={clsx('rounded-xl overflow-hidden', ModStyles.container, className)}
      />
    );
  }
);

const getPersonaAdClient = memoizee(() => {
  const stageApiKey = 'XXXX_api_key_staging_XXXX';

  const apiKey = EnvVars.PERSONA_ADS_API_KEY;
  const environment = apiKey && apiKey !== stageApiKey ? 'production' : 'staging';

  const sdk = new PersonaAdSDK({
    // @ts-expect-error // for not-importable `enum ENVIRONMENT`
    environment,
    apiKey: environment === 'staging' ? stageApiKey : apiKey
  });

  const client = sdk.getClient();

  const adUnitId =
    environment === 'staging' ? 'cf20c750-2fe4-4761-861f-b73b2247fd4d' : EnvVars.PERSONA_ADS_BANNER_UNIT_ID;

  return { client, adUnitId };
});
