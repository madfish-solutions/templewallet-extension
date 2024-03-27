import React, { memo, useEffect, useRef, useCallback } from 'react';

import clsx from 'clsx';

import { useAdRectObservation } from 'app/hooks/ads/use-ad-rect-observation';
import { AdsProviderTitle } from 'lib/ads';
import { getPersonaAdClient, PERSONA_STAGING_ADS_BANNER_UNIT_ID } from 'lib/ads/persona';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { EnvVars } from 'lib/env';
import { useAccountPkh } from 'lib/temple/front';

import { PartnersPromotionSelectors } from '../../selectors';
import { PartnersPromotionVariant, SingleProviderPromotionProps } from '../../types';
import { AD_BANNER_HEIGHT, buildAdClickAnalyticsProperties } from '../../utils';
import { CloseButton } from '../close-button';
import { ImageAdLabel } from '../image-promotion-view';

import ModStyles from './styles.module.css';

interface Props extends Omit<SingleProviderPromotionProps, 'variant'> {
  id: string;
}

export const PersonaPromotion = memo<Props>(({ id, isVisible, pageName, onReady, onError, onAdRectSeen, onClose }) => {
  const accountPkh = useAccountPkh();

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
    const { client, environment } = await getPersonaAdClient();
    const adUnitId =
      environment === 'staging' ? PERSONA_STAGING_ADS_BANNER_UNIT_ID : EnvVars.PERSONA_ADS_BANNER_UNIT_ID;

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
    <div className={clsx('relative rounded-xl overflow-hidden', `h-${AD_BANNER_HEIGHT}`, !isVisible && 'invisible')}>
      <div ref={ref} id={containerId} onClick={onClick} className={clsx('h-full', ModStyles.container)} />

      <ImageAdLabel />

      <CloseButton onClick={onClose} variant={PartnersPromotionVariant.Image} />
    </div>
  );
});
