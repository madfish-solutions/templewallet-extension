import { FC, useCallback, useEffect, useRef, useState } from 'react';

import { Native, NativeElement } from '@hypelab/sdk-react';

import { useElementValue } from 'app/hooks/ads/use-element-value';
import { AdsProviderTitle } from 'lib/ads';
import { EnvVars } from 'lib/env';
import { useUpdatableRef } from 'lib/ui/hooks';

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
  blacklistedCampaignSlugs,
  onImpression,
  onReady,
  onError
}) => {
  const [adRectVisible, setAdRectVisible] = useState(false);
  const adRectVisibleRef = useUpdatableRef(adRectVisible);
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

  const handleNonFatalError = useCallback(() => onError(false), [onError]);

  useEffect(() => {
    const impressionsListener = (event: Event) => {
      if (adRectVisibleRef.current && event.target === hypelabNativeElementRef.current) {
        onImpression();
      }
    };

    globalThis.addEventListener('impression', impressionsListener);

    return () => globalThis.removeEventListener('impression', impressionsListener);
  }, [adRectVisibleRef, onImpression, hypelabNativeElementRef]);

  useEffect(() => {
    if (!adIsReady) return;
    const el = hypelabNativeElementRef.current as unknown as { bid?: { cid?: string } } | null;
    const campaignSlug = el?.bid?.cid;
    if (campaignSlug && blacklistedCampaignSlugs?.includes(campaignSlug)) {
      onError();
    } else {
      onReady();
    }
  }, [adIsReady, onError, onReady, blacklistedCampaignSlugs, hypelabNativeElementRef]);

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
        onError={handleNonFatalError}
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
          onAdRectVisible={setAdRectVisible}
          onImageError={handleNonFatalError}
        />
      </Native>
    </div>
  );
};
