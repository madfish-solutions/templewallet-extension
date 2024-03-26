import React, { FC, useEffect, useRef } from 'react';

import { Native } from '@hypelab/sdk-react';

import { useAdTimeout } from 'app/hooks/ads/use-ad-timeout';
import { useElementValue } from 'app/hooks/ads/use-element-value';
import { AdsProviderTitle } from 'lib/ads';
import { EnvVars } from 'lib/env';

import { SingleProviderPromotionProps } from '../../types';
import { TextPromotionView } from '../text-promotion-view';

const getInnerText = (element: HTMLSpanElement) => element.innerText;
const getLinkHref = (element: HTMLAnchorElement) => element.href;
const getImageSrc = (element: HTMLImageElement) => element.src;

const innerTextObserverOptions = { childList: true };
const attributesObserverOptions = { attributes: true };

const dummyImageSrc =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

export const HypelabTextPromotion: FC<Omit<SingleProviderPromotionProps, 'variant'>> = ({
  isVisible,
  pageName,
  onAdRectSeen,
  onClose,
  onReady,
  onError
}) => {
  const hypelabHeadlineRef = useRef<HTMLSpanElement>(null);
  const hypelabBodyRef = useRef<HTMLSpanElement>(null);
  const hypelabCtaLinkRef = useRef<HTMLAnchorElement>(null);
  const hypelabIconRef = useRef<HTMLImageElement>(null);

  const headlineText = useElementValue(hypelabHeadlineRef, getInnerText, '', innerTextObserverOptions);
  const bodyText = useElementValue(hypelabBodyRef, getInnerText, '', innerTextObserverOptions);
  const ctaUrl = useElementValue(hypelabCtaLinkRef, getLinkHref, '/', attributesObserverOptions);
  const iconUrl = useElementValue(hypelabIconRef, getImageSrc, dummyImageSrc, attributesObserverOptions);
  const adIsReady = headlineText.length > 0;

  useAdTimeout(adIsReady, onError);

  useEffect(() => void (adIsReady && onReady()), [adIsReady, onReady]);

  return (
    <Native placement={EnvVars.HYPELAB_NATIVE_PLACEMENT_SLUG} onError={onError}>
      <span className="hidden" ref={hypelabHeadlineRef} data-ref="headline" />
      <span className="hidden" ref={hypelabBodyRef} data-ref="body" />
      <a className="hidden" ref={hypelabCtaLinkRef} href="/" data-ref="ctaLink">
        <img className="hidden" ref={hypelabIconRef} data-ref="icon" alt="" />
      </a>

      <TextPromotionView
        href={ctaUrl || '/'}
        imageSrc={iconUrl || dummyImageSrc}
        isVisible={isVisible}
        headline={headlineText}
        contentText={bodyText}
        providerTitle={AdsProviderTitle.HypeLab}
        pageName={pageName}
        onAdRectSeen={onAdRectSeen}
        onImageError={onError}
        onClose={onClose}
      />
    </Native>
  );
};
