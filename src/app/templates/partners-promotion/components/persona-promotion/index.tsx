import React, { memo, useEffect, useRef, useCallback } from 'react';

import clsx from 'clsx';
import memoizee from 'memoizee';

import { useAdRectObservation } from 'app/hooks/ads/use-ad-rect-observation';
import { AdsProviderTitle } from 'lib/ads';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { EnvVars } from 'lib/env';
import { useTezosAccountAddress } from 'temple/front';

import { PartnersPromotionSelectors } from '../../selectors';
import { PartnersPromotionVariant, SingleProviderPromotionProps } from '../../types';
import { buildAdClickAnalyticsProperties } from '../../utils';
import { CloseButton } from '../close-button';
import { ImageAdLabel } from '../image-promotion-view';

import ModStyles from './styles.module.css';

interface Props extends Omit<SingleProviderPromotionProps, 'variant'> {
  id: string;
}

export const PersonaPromotion = memo<Props>(({ id, isVisible, pageName, onReady, onError, onAdRectSeen, onClose }) => {
  const accountPkh = useTezosAccountAddress();

  const containerId = `persona-ad-${id}`;

  const ref = useRef<HTMLDivElement>(null);

  const { trackEvent } = useAnalytics();

  const onClick = useCallback(() => {
    const anchorElem = ref.current?.querySelector<HTMLAnchorElement>('a.persona-product');
    const href = anchorElem?.href;

    if (!href) {
      console.error('Persona ad href not found');
      return;
    }

    trackEvent(
      PartnersPromotionSelectors.promoLink,
      AnalyticsEventCategory.LinkPress,
      buildAdClickAnalyticsProperties(
        PartnersPromotionVariant.Image,
        AdsProviderTitle.Persona,
        pageName,
        accountPkh,
        href
      )
    );
  }, [trackEvent, pageName, accountPkh]);

  useAdRectObservation(ref, onAdRectSeen, isVisible);

  const injectAd = useCallback(async () => {
    const { client, adUnitId } = await getPersonaAdClient();

    await client.showBannerAd(
      // @ts-expect-error // for missung `adConfig` prop
      { adUnitId, containerId },
      errorMsg => {
        throw new Error(String(errorMsg));
      }
    );
  }, [containerId]);

  useEffect(
    () =>
      void injectAd().then(onReady, err => {
        console.error(err);
        onError();
      }),
    [injectAd, onReady, onError]
  );

  return (
    <div className={clsx('relative', !isVisible && 'invisible')}>
      <div
        ref={ref}
        id={containerId}
        onClick={onClick}
        className={clsx('rounded-xl overflow-hidden', ModStyles.container)}
      />

      <ImageAdLabel />

      <CloseButton onClick={onClose} variant={PartnersPromotionVariant.Image} />
    </div>
  );
});

const getPersonaAdClient = memoizee(
  async () => {
    const { PersonaAdSDK } = await import('@personaxyz/ad-sdk');

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
  },
  { promise: true }
);
