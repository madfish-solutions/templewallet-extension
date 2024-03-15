import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

import { useAdTimeout } from 'app/hooks/ads/use-ad-timeout';
import { usePartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { AdsProviderTitle } from 'lib/ads';
import { isEmptyPromotion } from 'lib/apis/optimal';
import { useTimeout } from 'lib/ui/hooks';

import { PartnersPromotionVariant, SingleProviderPromotionProps } from '../types';

import { ImagePromotionView } from './image-promotion-view';
import { TextPromotionView } from './text-promotion-view';

export const OptimalPromotion = memo<SingleProviderPromotionProps>(
  ({ isVisible, variant, pageName, onAdRectSeen, onClose, onReady, onError }) => {
    const [isImageBroken, setIsImageBroken] = useState(false);
    const [wasLoading, setWasLoading] = useState(false);
    const [shouldPreventShowingPrevAd, setShouldPreventShowingPrevAd] = useState(true);
    const { data: promo, error: errorFromStore, isLoading } = usePartnersPromoSelector();
    const prevIsLoadingRef = useRef(isLoading);
    const promotionIsEmpty = isEmptyPromotion(promo);
    const apiQueryFailed = (errorFromStore || promotionIsEmpty) && wasLoading;

    useAdTimeout((!errorFromStore && !promotionIsEmpty) || isLoading, onError, 2000);

    useEffect(() => {
      if (wasLoading) {
        setShouldPreventShowingPrevAd(false);
      }
    }, [wasLoading]);
    useTimeout(() => setShouldPreventShowingPrevAd(false), 2000);

    useEffect(() => {
      if (!isLoading && prevIsLoadingRef.current) {
        setWasLoading(true);
      }
      prevIsLoadingRef.current = isLoading;
    }, [isLoading]);

    useEffect(() => {
      if (apiQueryFailed) {
        onError();
      } else if (!promotionIsEmpty && !shouldPreventShowingPrevAd) {
        onReady();
      }
    }, [apiQueryFailed, onError, onReady, promotionIsEmpty, shouldPreventShowingPrevAd]);

    const onImageError = useCallback(() => {
      setIsImageBroken(true);
      onError();
    }, [onError]);

    if (errorFromStore || promotionIsEmpty || isImageBroken || shouldPreventShowingPrevAd) {
      return null;
    }

    const { link: href, image: imageSrc, copy } = promo;
    const { headline, content } = copy;

    const providerTitle = AdsProviderTitle.Optimal;

    if (variant === PartnersPromotionVariant.Image) {
      return (
        <ImagePromotionView
          href={href}
          isVisible={isVisible}
          providerTitle={providerTitle}
          pageName={pageName}
          onClose={onClose}
          onAdRectSeen={onAdRectSeen}
        >
          <img src={imageSrc} alt="Partners promotion" className="shadow-lg rounded-lg" onError={onImageError} />
        </ImagePromotionView>
      );
    }

    return (
      <TextPromotionView
        href={href}
        imageSrc={imageSrc}
        isVisible={isVisible}
        headline={headline}
        contentText={content}
        providerTitle={providerTitle}
        pageName={pageName}
        onAdRectSeen={onAdRectSeen}
        onImageError={onError}
        onClose={onClose}
      />
    );
  }
);
