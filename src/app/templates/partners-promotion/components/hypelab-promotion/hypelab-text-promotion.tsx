import React, { FC, useEffect, useRef } from 'react';

import { Native, NativeElement } from '@hypelab/sdk-react';

import { useAdTimeout } from 'app/hooks/ads/use-ad-timeout';
import { useElementValue } from 'app/hooks/ads/use-element-value';
import { AdsProviderTitle } from 'lib/ads';
import { EnvVars } from 'lib/env';

import { SingleProviderPromotionProps } from '../../types';
import { TextPromotionView } from '../text-promotion-view';

import { useChildAdElementRef } from './use-child-ad-element-ref';

const getInnerText = (element: HTMLSpanElement) => element.innerText;
const getLinkHref = (element: HTMLAnchorElement) => element.href;
const getImageSrc = (element: HTMLImageElement) => element.src;

const innerTextObserverOptions = { childList: true };
const attributesObserverOptions = { attributes: true };

const dummyImageSrc =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

export const HypelabTextPromotion: FC<Omit<SingleProviderPromotionProps, 'variant'>> = ({
  accountPkh,
  isVisible,
  pageName,
  onAdRectSeen,
  onReady,
  onError
}) => {
  const hypelabHeadlineRef = useRef<HTMLSpanElement>(null);
  const hypelabBodyRef = useRef<HTMLSpanElement>(null);
  const hypelabCtaLinkRef = useRef<HTMLAnchorElement>(null);
  const hypelabIconRef = useRef<HTMLImageElement>(null);
  const hypelabNativeParentRef = useRef<HTMLDivElement>(null);
  const hypelabNativeElementRef = useChildAdElementRef(hypelabNativeParentRef, 'hype-native');

  const headlineText = useElementValue(hypelabHeadlineRef, getInnerText, '', innerTextObserverOptions);
  const bodyText = useElementValue(hypelabBodyRef, getInnerText, '', innerTextObserverOptions);
  const ctaUrl = useElementValue(hypelabCtaLinkRef, getLinkHref, '/', attributesObserverOptions);
  const iconUrl = useElementValue(hypelabIconRef, getImageSrc, dummyImageSrc, attributesObserverOptions);
  const adIsReady = headlineText.length > 0;

  useAdTimeout(adIsReady, onError);

  useEffect(() => {
    if (adIsReady) {
      onReady();
    }
  }, [adIsReady, onReady]);

  useEffect(() => {
    // Ad refreshing isn't stopped by `@hypelab/sdk-react` itself
    let ad = hypelabNativeElementRef.current as NativeElement | null;
    let adCheckInterval: NodeJS.Timeout | null = null;

    if (!ad) {
      adCheckInterval = setInterval(() => {
        ad = hypelabNativeElementRef.current as NativeElement | null;
        if (ad) {
          clearInterval(adCheckInterval!);
        }
      }, 20);
    }

    return () => {
      if (adCheckInterval) {
        clearInterval(adCheckInterval);
      }

      if (ad) {
        // @ts-expect-error
        ad.disconnectedCallback();
      }
    };
  }, [hypelabNativeElementRef]);

  return (
    <div className="w-full" ref={hypelabNativeParentRef}>
      <Native
        // @ts-expect-error
        class="w-full"
        placement={EnvVars.HYPELAB_INTERNAL_NATIVE_PLACEMENT_SLUG}
        onError={onError}
      >
        <span className="hidden" ref={hypelabHeadlineRef} data-ref="headline" />
        <span className="hidden" ref={hypelabBodyRef} data-ref="body" />
        <a className="hidden" ref={hypelabCtaLinkRef} href="/" data-ref="ctaLink">
          <img className="hidden" ref={hypelabIconRef} data-ref="icon" alt="" />
        </a>

        <TextPromotionView
          accountPkh={accountPkh}
          href={ctaUrl || '/'}
          imageSrc={iconUrl || dummyImageSrc}
          isVisible={isVisible}
          headline={headlineText}
          contentText={bodyText}
          providerTitle={AdsProviderTitle.HypeLab}
          pageName={pageName}
          onAdRectSeen={onAdRectSeen}
          onImageError={onError}
        />
      </Native>
    </div>
  );
};
