import React, { FC, useEffect, useRef, useState } from 'react';

import { Native, NativeElement } from '@hypelab/sdk-react';

import { useAdTimeout } from 'app/hooks/ads/use-ad-timeout';
import { useElementValue } from 'app/hooks/ads/use-element-value';
import { EnvVars } from 'lib/env';

import { SingleProviderPromotionProps, HypelabNativeAd } from '../../types';
import { TextPromotionView } from '../text-promotion-view';

import { getHypelabNativeAd } from './get-hypelab-ad';

const getInnerText = (element: HTMLSpanElement) => element.innerText;

const innerTextObserverOptions = { childList: true };

const dummyImageSrc =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

export const HypelabTextPromotion: FC<Omit<SingleProviderPromotionProps, 'variant'>> = ({
  isVisible,
  onAdRectSeen,
  onClose,
  onReady,
  onError
}) => {
  const hypelabHeadlineRef = useRef<HTMLSpanElement>(null);
  const hypelabNativeElementRef = useRef<NativeElement>(null);

  const [currentAd, setCurrentAd] = useState<HypelabNativeAd | null>(null);
  const headlineText = useElementValue(hypelabHeadlineRef, getInnerText, '', innerTextObserverOptions);
  const adIsReady = headlineText.length > 0;

  useAdTimeout(adIsReady, onError);

  useEffect(() => {
    if (!adIsReady) return;

    const elem = hypelabNativeElementRef.current;
    const ad = elem && getHypelabNativeAd(elem);

    if (!ad) {
      onError();
      return;
    }

    setCurrentAd(ad);
    onReady();
  }, [adIsReady, onReady, onError]);

  return (
    <Native placement={EnvVars.HYPELAB_NATIVE_PLACEMENT_SLUG} ref={hypelabNativeElementRef}>
      <span className="hidden" ref={hypelabHeadlineRef} data-ref="headline" />

      <TextPromotionView
        href={currentAd?.cta_url ?? '/'}
        imageSrc={currentAd?.creative_set.icon.url ?? dummyImageSrc}
        isVisible={isVisible}
        headline={currentAd?.headline ?? ''}
        contentText={currentAd?.body}
        onAdRectSeen={onAdRectSeen}
        onImageError={onError}
        onClose={onClose}
      />
    </Native>
  );
};
