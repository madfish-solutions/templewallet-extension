import React, { memo, useEffect, useRef, useCallback } from 'react';

import clsx from 'clsx';

import { useAdRectObservation } from 'app/hooks/ads/use-ad-rect-observation';
import { AdsProviderTitle } from 'lib/ads';
import { getPersonaAdClient } from 'lib/ads/persona';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { EnvVars } from 'lib/env';

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
      buildAdClickAnalyticsProperties(PartnersPromotionVariant.Image, AdsProviderTitle.Persona, pageName, href)
    );
  }, [trackEvent, pageName]);

  useAdRectObservation(ref, onAdRectSeen, isVisible);

  const injectAd = useCallback(async () => {
    const { client, environment } = await getPersonaAdClient();
    const adUnitId =
      environment === 'staging' ? 'cf20c750-2fe4-4761-861f-b73b2247fd4d' : EnvVars.PERSONA_ADS_BANNER_UNIT_ID;

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
