import React, { FC, memo, useCallback, useEffect, useState } from 'react';

import { useDispatch } from 'react-redux';

import { useAppEnv } from 'app/env';
import { ReactComponent as CloseIcon } from 'app/icons/close.svg';
import { hidePromotionAction } from 'app/store/partners-promotion/actions';
import {
  useShouldShowPartnersPromoSelector,
  usePartnersPromoSelector,
  usePromotionHidingTimestampSelector
} from 'app/store/partners-promotion/selectors';
import { isEmptyPromotion } from 'lib/apis/optimal';
import { AD_HIDING_TIMEOUT } from 'lib/constants';
import { t } from 'lib/i18n';

import { Anchor } from './Anchor';
import { PartnersPromotionSelectors } from './partners-promotion.selectors';
import Spinner from './Spinner/Spinner';

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

  const [isHiddenTemporarily, setIsHiddenTemporarily] = useState(shouldBeHiddenTemporarily(hiddenAt));
  const [isImageBroken, setIsImageBroken] = useState(false);
  const { data: promo, isLoading, error } = usePartnersPromoSelector();
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

  if (!shouldShowPartnersPromo || Boolean(error) || isEmptyPromotion(promo) || isImageBroken || isHiddenTemporarily) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center rounded-lg max-w-sm bg-gray-100 w-full" style={{ height: 112 }}>
        <Spinner className="w-16 h-4" theme="gray" />
      </div>
    );
  }

  if (variant === PartnersPromotionVariant.Text) {
    return (
      <div className="relative bg-gray-100 w-full max-w-sm overflow-hidden">
        <Anchor
          className="flex items-start justify-start gap-2 p-4 max-w-sm w-full"
          href={promo.link}
          target="_blank"
          rel="noreferrer"
          testID={PartnersPromotionSelectors.promoLink}
          testIDProperties={{ variant, href: promo.link }}
        >
          <img className="h-10 w-10 rounded-circle" src={promo.image} alt="Partners promotion" onError={onImageError} />
          <div className="flex flex-col gap-1">
            <div className="flex gap-1">
              <span className="text-gray-910 font-medium">{promo.copy.headline}</span>
              <div className="flex items-center px-1 rounded bg-blue-500 text-xs font-medium text-white">AD</div>
            </div>
            <span className="text-xs text-gray-600">{promo.copy.content}</span>
          </div>
        </Anchor>
        <button
          className="absolute top-2 right-2 z-10 p-1 border-gray-300 border rounded"
          onClick={handleClosePartnersPromoClick}
          title={t('hideAd')}
        >
          <CloseIcon className="w-auto h-4" style={{ stroke: '#718096', strokeWidth: 2 }} />
        </button>
      </div>
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
      <Anchor
        href={promo.link}
        target="_blank"
        rel="noreferrer"
        testID={PartnersPromotionSelectors.promoLink}
        testIDProperties={{ variant, href: promo.link }}
      >
        <img src={promo.image} alt="Partners promotion" className="shadow-lg rounded-lg" onError={onImageError} />
      </Anchor>
    </div>
  );
});
