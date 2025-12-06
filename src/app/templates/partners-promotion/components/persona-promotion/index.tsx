import React, { memo, useEffect, useRef, useCallback, useState } from 'react';

import clsx from 'clsx';

import { useAdRectObservation } from 'app/hooks/ads/use-ad-rect-observation';
import { useElementValue } from 'app/hooks/ads/use-element-value';
import { AdsProviderTitle } from 'lib/ads';
import { getPersonaAdClient, PERSONA_STAGING_ADS_BANNER_UNIT_ID } from 'lib/ads/persona';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { EnvVars } from 'lib/env';

import { PartnersPromotionSelectors } from '../../selectors';
import { PartnersPromotionVariant, SingleProviderPromotionProps } from '../../types';
import { buildAdClickAnalyticsProperties } from '../../utils';
import { ImagePromotionView } from '../image-promotion-view';

import ModStyles from './styles.module.css';

interface Props extends Omit<SingleProviderPromotionProps, 'variant'> {
  id: string;
}

interface AdProperties {
  href: string;
  backgroundAssetUrl?: string;
  backgroundAssetType?: 'image' | 'video';
}

const DEFAULT_AD_PROPERTIES: AdProperties = { href: '#' };

const adPropsObservationOptions = { childList: true, subtree: true };

const getAdProperties = (adRoot: HTMLDivElement): AdProperties => {
  const adLink = adRoot.querySelector<HTMLAnchorElement>('a.persona-product');
  const adImage = adRoot.querySelector<HTMLImageElement>('img');
  const adVideo = adRoot.querySelector<HTMLVideoElement>('video');

  return {
    href: adLink?.href ?? '#',
    backgroundAssetUrl: adImage?.src ?? adVideo?.src,
    backgroundAssetType: adVideo?.src ? 'video' : 'image'
  };
};

export const PersonaPromotion = memo<Props>(
  ({ id, isVisible, pageName, accountPkh, onReady, onError, onImpression }) => {
    const containerId = `persona-ad-${id}`;
    const [adRectVisible, setAdRectVisible] = useState(false);
    const [adIsReady, setAdIsReady] = useState(false);

    const ref = useRef<HTMLDivElement>(null);

    const { href, backgroundAssetUrl, backgroundAssetType } = useElementValue(
      ref,
      getAdProperties,
      DEFAULT_AD_PROPERTIES,
      adPropsObservationOptions
    );

    const { trackEvent } = useAnalytics();

    const onClick = useCallback(() => {
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
    }, [href, trackEvent, pageName, accountPkh]);

    useAdRectObservation(ref, setAdRectVisible, isVisible);

    const impressionSentRef = useRef(false);
    useEffect(() => {
      if (adRectVisible && adIsReady && !impressionSentRef.current) {
        onImpression();
        impressionSentRef.current = true;
      }
    }, [adRectVisible, adIsReady, onImpression]);

    const injectAd = useCallback(async () => {
      const { client, environment } = await getPersonaAdClient(accountPkh);
      const adUnitId =
        environment === 'staging' ? PERSONA_STAGING_ADS_BANNER_UNIT_ID : EnvVars.PERSONA_ADS_BANNER_UNIT_ID;

      await client.showBannerAd(
        // @ts-expect-error // for missung `adConfig` prop
        { adUnitId, containerId },
        errorMsg => {
          throw new Error(String(errorMsg));
        }
      );
    }, [accountPkh, containerId]);

    useEffect(
      () =>
        void injectAd().then(
          () => {
            onReady();
            setAdIsReady(true);
          },
          err => {
            console.error(err);
            onError();
            setAdIsReady(false);
          }
        ),
      [injectAd, onReady, onError]
    );

    return (
      <ImagePromotionView
        href={href}
        isVisible={isVisible}
        providerTitle={AdsProviderTitle.HypeLab}
        pageName={pageName}
        accountPkh={accountPkh}
        onAdRectVisible={setAdRectVisible}
        backgroundAssetUrl={backgroundAssetUrl}
        backgroundAssetType={backgroundAssetType}
      >
        <div
          ref={ref}
          id={containerId}
          onClick={onClick}
          className={clsx('h-full rounded overflow-hidden', ModStyles.container)}
        />
      </ImagePromotionView>
    );
  }
);
