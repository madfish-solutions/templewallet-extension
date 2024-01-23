import React, { FC, memo, useCallback, useEffect, useState, useRef } from 'react';

import { Banner, BannerElement, Native } from '@hypelab/sdk-react';
import { useDispatch } from 'react-redux';

import { useAppEnv } from 'app/env';
import { ReactComponent as CloseIcon } from 'app/icons/close.svg';
import { hidePromotionAction } from 'app/store/partners-promotion/actions';
import {
  useShouldShowPartnersPromoSelector,
  /* usePartnersPromoSelector, */
  usePromotionHidingTimestampSelector
} from 'app/store/partners-promotion/selectors';
import { AnalyticsEventCategory, setTestID, useAnalytics } from 'lib/analytics';
// import { isEmptyPromotion } from 'lib/apis/optimal';
import { AD_HIDING_TIMEOUT } from 'lib/constants';
import { EnvVars } from 'lib/env';
import { t } from 'lib/i18n';

import { PartnersPromotionSelectors } from './partners-promotion.selectors';
// import Spinner from './Spinner/Spinner';

export enum PartnersPromotionVariant {
  Text = 'Text',
  Image = 'Image'
}

interface Props {
  variant: PartnersPromotionVariant;
  /** For distinguishing the ads that should be hidden temporarily */
  id: string;
}

const POPUP_IMAGE_WIDTH = 328;
const FULL_IMAGE_WIDTH = 384;

const shouldBeHiddenTemporarily = (hiddenAt: number) => {
  return Date.now() - hiddenAt < AD_HIDING_TIMEOUT;
};

export const PartnersPromotion: FC<Props> = memo(({ variant, id }) => {
  const dispatch = useDispatch();
  const { popup } = useAppEnv();
  const hiddenAt = usePromotionHidingTimestampSelector(id);
  const { trackEvent } = useAnalytics();

  const [isHiddenTemporarily, setIsHiddenTemporarily] = useState(shouldBeHiddenTemporarily(hiddenAt));
  const linkRef = useRef<HTMLAnchorElement>(null);
  const bannerRef = useRef<BannerElement>(null);
  const [isImageBroken, setIsImageBroken] = useState(false);
  /* const { data: promo, isLoading, error } = usePartnersPromoSelector(); */
  const shouldShowPartnersPromo = useShouldShowPartnersPromoSelector();

  useEffect(() => {
    const newIsHiddenTemporarily = shouldBeHiddenTemporarily(hiddenAt);
    setIsHiddenTemporarily(newIsHiddenTemporarily);

    if (newIsHiddenTemporarily) {
      const timeout = setTimeout(
        () => setIsHiddenTemporarily(false),
        Math.max(Date.now() - hiddenAt + AD_HIDING_TIMEOUT, 0)
      );

      return () => clearTimeout(timeout);
    }

    return;
  }, [hiddenAt]);

  const handleClosePartnersPromoClick = useCallback(() => {
    dispatch(hidePromotionAction({ timestamp: Date.now(), id }));
  }, [id, dispatch]);

  const onImageError = useCallback(() => {
    setIsImageBroken(true);
  }, []);

  // Sending link URL may be missing
  const handleAdClick = useCallback(
    () =>
      trackEvent(PartnersPromotionSelectors.promoLink, AnalyticsEventCategory.LinkPress, {
        variant,
        // @ts-ignore
        href: variant === PartnersPromotionVariant.Text ? linkRef.current?.href : bannerRef.current?.ad?.cta_url
      }),
    [trackEvent, variant]
  );

  if (
    !shouldShowPartnersPromo ||
    /* Boolean(error) || isEmptyPromotion(promo) || */ isImageBroken ||
    isHiddenTemporarily
  ) {
    return null;
  }

  // Handling 'loading' status and most of errors are missing
  /* if (isLoading) {
    return (
      <div className="flex justify-center items-center rounded-lg max-w-sm bg-gray-100 w-full" style={{ height: 112 }}>
        <Spinner className="w-16 h-4" theme="gray" />
      </div>
    );
  } */

  if (variant === PartnersPromotionVariant.Text) {
    return (
      <Native placement={EnvVars.HYPELAB_NATIVE_PLACEMENT_SLUG}>
        <div className="relative bg-gray-100 w-full max-w-sm overflow-hidden">
          <a
            className="flex items-start justify-start gap-2 p-4 max-w-sm w-full"
            data-ref="ctaLink"
            href="/"
            target="_blank"
            rel="noreferrer"
            ref={linkRef}
            onClick={handleAdClick}
            {...setTestID(PartnersPromotionSelectors.promoLink)}
          >
            <div className="flex items-start justify-start gap-2 p-4 max-w-sm w-full">
              <img
                className="h-10 w-10 rounded-circle"
                data-ref="icon"
                alt="Partners promotion"
                onError={onImageError}
              />
              <div className="flex flex-col gap-1">
                <div className="flex gap-1">
                  <span className="text-gray-910 font-medium" data-ref="headline" />
                  <div className="flex items-center px-1 rounded bg-blue-500 text-xs font-medium text-white">AD</div>
                </div>
                <span className="text-xs text-gray-600" data-ref="body" />
              </div>
            </div>
          </a>
          <button
            className="absolute top-2 right-2 z-10 p-1 border-gray-300 border rounded"
            onClick={handleClosePartnersPromoClick}
            title={t('hideAd')}
          >
            <CloseIcon className="w-auto h-4" style={{ stroke: '#718096', strokeWidth: 2 }} />
          </button>
        </div>
      </Native>
    );
  }

  return (
    <div
      className="relative flex rounded-lg max-w-sm w-full overflow-hidden"
      style={{ height: 112, width: popup ? POPUP_IMAGE_WIDTH : FULL_IMAGE_WIDTH }}
    >
      <div className="absolute px-3 rounded-tl-lg rounded-br-lg bg-blue-500 text-sm font-semibold text-white">AD</div>
      <button
        className="absolute top-2 right-4 h-6 w-6 z-10 bg-blue-500 rounded-circle"
        onClick={handleClosePartnersPromoClick}
        title={t('hideAd')}
      >
        <CloseIcon className="w-4 h-4 m-auto" style={{ strokeWidth: 3 }} />
      </button>
      <Banner
        placement={EnvVars.HYPELAB_SMALL_PLACEMENT_SLUG}
        data-testid={PartnersPromotionSelectors.promoLink}
        onClick={handleAdClick}
        ref={bannerRef}
      />
    </div>
  );
});
