import React, { memo, MouseEventHandler, useCallback, useEffect, useState } from 'react';

import clsx from 'clsx';
import { useDispatch } from 'react-redux';

import Spinner from 'app/atoms/Spinner/Spinner';
import { useAppEnv } from 'app/env';
import { hidePromotionAction } from 'app/store/partners-promotion/actions';
import {
  useShouldShowPartnersPromoSelector,
  usePromotionHidingTimestampSelector
} from 'app/store/partners-promotion/selectors';
import { AD_HIDING_TIMEOUT } from 'lib/constants';

import { HypelabPromotion } from './components/hypelab-promotion';
import { OptimalPromotion } from './components/optimal-promotion';
import styles from './partners-promotion.module.css';
import { PartnersPromotionVariant } from './types';

export { PartnersPromotionVariant } from './types';

interface PartnersPromotionProps {
  variant: PartnersPromotionVariant;
  /** For distinguishing the ads that should be hidden temporarily */
  id: string;
}

const shouldBeHiddenTemporarily = (hiddenAt: number) => {
  return Date.now() - hiddenAt < AD_HIDING_TIMEOUT;
};

export const PartnersPromotion = memo<PartnersPromotionProps>(({ variant, id }) => {
  const isImageAd = variant === PartnersPromotionVariant.Image;
  const { popup } = useAppEnv();
  const dispatch = useDispatch();
  const hiddenAt = usePromotionHidingTimestampSelector(id);
  const shouldShowPartnersPromo = useShouldShowPartnersPromoSelector();

  const [isHiddenTemporarily, setIsHiddenTemporarily] = useState(shouldBeHiddenTemporarily(hiddenAt));
  const [shouldUseOptimalAd, setShouldUseOptimalAd] = useState(true);
  const [adError, setAdError] = useState(false);
  const [adIsReady, setAdIsReady] = useState(false);

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

  const handleClosePartnersPromoClick = useCallback<MouseEventHandler<HTMLButtonElement>>(
    e => {
      e.preventDefault();
      e.stopPropagation();
      dispatch(hidePromotionAction({ timestamp: Date.now(), id }));
    },
    [id, dispatch]
  );

  const handleOptimalError = useCallback(() => setShouldUseOptimalAd(false), []);
  const handleHypelabError = useCallback(() => setAdError(true), []);

  const handleOptimalAdReady = useCallback(() => {
    console.log('optimal');
    setAdIsReady(true);
  }, []);
  const handleHypelabAdReady = useCallback(() => {
    console.log('hypelab');
    setAdIsReady(true);
  }, []);

  if (!shouldShowPartnersPromo || adError || isHiddenTemporarily) {
    return null;
  }

  return (
    <div className={clsx('w-full relative', !adIsReady && (isImageAd ? styles.imageAdLoading : styles.textAdLoading))}>
      {shouldUseOptimalAd ? (
        <OptimalPromotion
          variant={variant}
          isVisible={adIsReady}
          onClose={handleClosePartnersPromoClick}
          onReady={handleOptimalAdReady}
          onError={handleOptimalError}
        />
      ) : (
        <HypelabPromotion
          variant={variant}
          isVisible={adIsReady}
          onClose={handleClosePartnersPromoClick}
          onReady={handleHypelabAdReady}
          onError={handleHypelabError}
        />
      )}
      {!adIsReady && (
        <div
          className={clsx(
            'absolute top-0 left-0 w-full h-full bg-gray-100 flex justify-center items-center',
            !popup && 'rounded-xl'
          )}
        >
          <Spinner theme="dark-gray" className="w-6" />
        </div>
      )}
    </div>
  );
});
