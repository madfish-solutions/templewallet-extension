import React, { FC, useCallback, useEffect, useRef, useState } from 'react';

import { Banner } from '@hypelab/sdk-react';

import { useAdTimeout } from 'app/hooks/ads/use-ad-timeout';
import { AdsProviderTitle } from 'lib/ads';
import { HYPELAB_STUB_CAMPAIGN_SLUG } from 'lib/constants';
import { EnvVars } from 'lib/env';

import { HypelabBannerAd, SingleProviderPromotionProps } from '../../types';
import { ImagePromotionView } from '../image-promotion-view';

import { getHypelabBannerAd } from './get-hypelab-ad';
import { useChildAdElementRef } from './use-child-ad-element-ref';

export const HypelabImagePromotion: FC<Omit<SingleProviderPromotionProps, 'variant'>> = ({
  isVisible,
  pageName,
  onAdRectSeen,
  onClose,
  onError,
  onReady
}) => {
  const hypelabBannerParentRef = useRef<HTMLDivElement>(null);
  const hypelabBannerElementRef = useChildAdElementRef(hypelabBannerParentRef, 'hype-banner');
  const [adIsReady, setAdIsReady] = useState(false);
  const [currentAd, setCurrentAd] = useState<HypelabBannerAd | null>(null);
  const prevAdUrlRef = useRef('');

  useAdTimeout(adIsReady, onError);

  const handleReady = useCallback(() => {
    try {
      if (!hypelabBannerElementRef.current) {
        throw new Error('Failed to find banner element');
      }

      const ad = getHypelabBannerAd(hypelabBannerElementRef.current);

      if (ad && prevAdUrlRef.current !== ad.cta_url && ad.campaign_slug === HYPELAB_STUB_CAMPAIGN_SLUG) {
        throw new Error('Stub ad detected');
      } else if (ad && prevAdUrlRef.current !== ad.cta_url) {
        setCurrentAd(ad);
        prevAdUrlRef.current = ad.cta_url;
        setAdIsReady(true);
        onReady();
      }
    } catch (e) {
      console.error(e);
      onError();
    }
  }, [hypelabBannerElementRef, onError, onReady]);

  useEffect(() => {
    // Banner refreshing isn't stopped by `@hypelab/sdk-react` itself
    const banner = hypelabBannerElementRef.current;

    return () => {
      if (banner) {
        // @ts-expect-error
        banner.disconnectedCallback();
      }
    };
  }, [hypelabBannerElementRef]);

  return (
    <ImagePromotionView
      onClose={onClose}
      href={currentAd?.cta_url ?? '#'}
      isVisible={isVisible}
      providerTitle={AdsProviderTitle.HypeLab}
      pageName={pageName}
      onAdRectSeen={onAdRectSeen}
    >
      <div ref={hypelabBannerParentRef}>
        <Banner
          placement={EnvVars.HYPELAB_SMALL_PLACEMENT_SLUG}
          // @ts-expect-error
          class="rounded-xl overflow-hidden"
          onReady={handleReady}
          onError={onError}
        />
      </div>
    </ImagePromotionView>
  );
};
