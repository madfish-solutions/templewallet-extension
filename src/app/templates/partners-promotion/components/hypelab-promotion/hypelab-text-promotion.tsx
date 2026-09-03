import { FC, useEffect, useRef, useState } from 'react';

import { Native, NativeElement } from '@hypelab/sdk-react';

import { useElementValue } from 'app/hooks/ads/use-element-value';
import { AdsProviderTitle } from 'lib/ads';
import { EnvVars } from 'lib/env';
import { useTimeout, useUpdatableRef } from 'lib/ui/hooks';

import { HypelabPromotionProps } from '../../types';
import { TextPromotionView } from '../text-promotion-view';

import { useChildAdElementRef } from './use-child-ad-element-ref';

const getInnerText = (element: HTMLSpanElement) => element.innerText;
const getLinkHref = (element: HTMLAnchorElement) => element.href;
const getImageSrc = (element: HTMLImageElement) => element.src;

const innerTextObserverOptions = { childList: true };
const attributesObserverOptions = { attributes: true };

const dummyImageSrc =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const AD_LOADING_TIMEOUT = 3_000;

export const HypelabTextPromotion: FC<Omit<HypelabPromotionProps, 'variant'>> = ({
  accountPkh,
  isVisible,
  pageName,
  blacklistedCampaignSlugs,
  unpaidCampaignSlugs,
  onImpression,
  onReady,
  onError,
  onNoPaidAd,
  showNonPaidAd
}) => {
  const [adRectVisible, setAdRectVisible] = useState(false);
  const adRectVisibleRef = useUpdatableRef(adRectVisible);
  const hypelabHeadlineRef = useRef<HTMLSpanElement>(null);
  const hypelabBodyRef = useRef<HTMLSpanElement>(null);
  const hypelabCtaLinkRef = useRef<HTMLAnchorElement>(null);
  const hypelabIconRef = useRef<HTMLImageElement>(null);
  const hypelabNativeParentRef = useRef<HTMLDivElement>(null);
  const hypelabNativeElementRef = useChildAdElementRef(hypelabNativeParentRef, 'hype-native');
  const [adIsHidden, setAdIsHidden] = useState(false);

  const headlineText = useElementValue(hypelabHeadlineRef, getInnerText, '', innerTextObserverOptions);
  const bodyText = useElementValue(hypelabBodyRef, getInnerText, '', innerTextObserverOptions);
  const ctaUrl = useElementValue(hypelabCtaLinkRef, getLinkHref, '/', attributesObserverOptions);
  const iconUrl = useElementValue(hypelabIconRef, getImageSrc, dummyImageSrc, attributesObserverOptions);

  const handleImageError = () => setAdIsHidden(true);

  useTimeout(() => {
    if (headlineText.length === 0) {
      onError();
    }
  }, AD_LOADING_TIMEOUT);

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
    const errorListener = (event: Event) => {
      if (event.target === hypelabNativeElementRef.current) {
        onError();
      }
    };

    globalThis.addEventListener('error', errorListener);

    return () => globalThis.removeEventListener('error', errorListener);
  }, [onError, hypelabNativeElementRef]);

  useEffect(() => {
    const adIsReady = headlineText.length > 0;

    if (!adIsReady) return;

    const el = hypelabNativeElementRef.current as unknown as { bid?: { cid?: string } } | null;
    const campaignSlug = el?.bid?.cid ?? '';
    const isBlacklisted = blacklistedCampaignSlugs?.includes(campaignSlug) ?? false;
    const isUnpaid = unpaidCampaignSlugs?.includes(campaignSlug) ?? false;

    const isDisplayable = !isBlacklisted && (!isUnpaid || showNonPaidAd);
    if (isDisplayable) {
      setAdIsHidden(false);
      onReady();
    } else {
      setAdIsHidden(true);
      onNoPaidAd();
    }
  }, [
    headlineText,
    onReady,
    onNoPaidAd,
    showNonPaidAd,
    blacklistedCampaignSlugs,
    unpaidCampaignSlugs,
    hypelabNativeElementRef
  ]);

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
          isVisible={isVisible && !adIsHidden}
          headline={headlineText}
          contentText={bodyText}
          providerTitle={AdsProviderTitle.HypeLab}
          pageName={pageName}
          onAdRectVisible={setAdRectVisible}
          onImageError={handleImageError}
        />
      </Native>
    </div>
  );
};
