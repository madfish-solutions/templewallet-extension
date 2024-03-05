import React, { FC, useEffect, useRef, useState } from 'react';

import { Banner, BannerElement } from '@hypelab/sdk-react';

import { useAdTimeout } from 'app/hooks/ads/use-ad-timeout';
import { useElementValue } from 'app/hooks/ads/use-element-value';
import { EnvVars } from 'lib/env';

import { HypelabBannerAd, SingleProviderPromotionProps } from '../../types';
import { ImagePromotionView } from '../image-promotion-view';

import { getHypelabAd } from './get-hypelab-ad';

const bannerIsDisplayed = (element: BannerElement) => {
  const styles = window.getComputedStyle(element);

  return styles.getPropertyValue('display') !== 'none';
};

const adAttributesObserverOptions = { attributes: true };

export const HypelabImagePromotion: FC<Omit<SingleProviderPromotionProps, 'variant'>> = ({
  providerTitle,
  pageName,
  isVisible,
  onAdRectSeen,
  onClose,
  onError,
  onReady
}) => {
  const hypelabBannerElementRef = useRef<BannerElement>(null);
  const [adIsReady, setAdIsReady] = useState(false);
  const [currentAd, setCurrentAd] = useState<HypelabBannerAd | null>(null);
  const adIsDisplayed = useElementValue(hypelabBannerElementRef, bannerIsDisplayed, true, adAttributesObserverOptions);
  const prevAdUrlRef = useRef('');

  useAdTimeout(adIsReady, onError);

  useEffect(() => {
    if (!adIsReady) {
      return;
    }

    const adUrlUpdateInterval = setInterval(() => {
      const ad = getHypelabAd(hypelabBannerElementRef.current!) as unknown as HypelabBannerAd;

      if (ad.cta_url !== prevAdUrlRef.current) {
        setCurrentAd(ad);
        prevAdUrlRef.current = ad.cta_url;
      }
    }, 20);

    return () => clearInterval(adUrlUpdateInterval);
  }, [adIsReady]);

  useEffect(() => {
    if (!hypelabBannerElementRef.current) {
      return;
    }

    const ad = getHypelabAd(hypelabBannerElementRef.current);
    if (adIsDisplayed && ad) {
      setCurrentAd(ad);
      prevAdUrlRef.current = ad.cta_url;
      setAdIsReady(true);
      onReady();
    }
  }, [adIsDisplayed, onReady]);

  useEffect(() => {
    // Banner refreshing isn't stopped by `@hypelab/sdk-react` itself
    const banner = hypelabBannerElementRef.current;

    return () => {
      if (banner) {
        // @ts-expect-error
        banner.disconnectedCallback();
      }
    };
  }, []);

  return (
    <ImagePromotionView
      pageName={pageName}
      providerTitle={providerTitle}
      onClose={onClose}
      href={currentAd?.cta_url ?? '#'}
      isVisible={isVisible}
      onAdRectSeen={onAdRectSeen}
    >
      <Banner
        placement={EnvVars.HYPELAB_SMALL_PLACEMENT_SLUG}
        ref={hypelabBannerElementRef}
        // @ts-expect-error
        class="rounded-xl overflow-hidden"
      />
    </ImagePromotionView>
  );
};
