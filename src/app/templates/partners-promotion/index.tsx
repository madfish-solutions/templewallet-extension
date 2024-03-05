import React, { memo, MouseEventHandler, useCallback, useEffect, useState } from 'react';

import clsx from 'clsx';
import { useDispatch } from 'react-redux';

import Spinner from 'app/atoms/Spinner/Spinner';
import { useAppEnv } from 'app/env';
import { hidePromotionAction, setLastReportedPageNameAction } from 'app/store/partners-promotion/actions';
import {
  useLastReportedPageNameSelector,
  useShouldShowPartnersPromoSelector,
  usePromotionHidingTimestampSelector
} from 'app/store/partners-promotion/selectors';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { AD_HIDING_TIMEOUT } from 'lib/constants';
import { useAccount } from 'lib/temple/front';

import { HypelabPromotion } from './components/hypelab-promotion';
import { OptimalPromotion } from './components/optimal-promotion';
import styles from './partners-promotion.module.css';
import { PartnersPromotionVariant } from './types';

export { PartnersPromotionVariant } from './types';

interface PartnersPromotionProps {
  variant: PartnersPromotionVariant;
  /** For distinguishing the ads that should be hidden temporarily */
  id: string;
  pageName: string;
}

const shouldBeHiddenTemporarily = (hiddenAt: number) => {
  return Date.now() - hiddenAt < AD_HIDING_TIMEOUT;
};

export const PartnersPromotion = memo<PartnersPromotionProps>(({ variant, id, pageName }) => {
  const isImageAd = variant === PartnersPromotionVariant.Image;
  const { publicKeyHash: accountPkh } = useAccount();
  const { trackEvent } = useAnalytics();
  const { popup } = useAppEnv();
  const dispatch = useDispatch();
  const hiddenAt = usePromotionHidingTimestampSelector(id);
  const shouldShowPartnersPromo = useShouldShowPartnersPromoSelector();
  const lastReportedPageName = useLastReportedPageNameSelector();

  const [isHiddenTemporarily, setIsHiddenTemporarily] = useState(shouldBeHiddenTemporarily(hiddenAt));
  const [shouldUseOptimalAd, setShouldUseOptimalAd] = useState(true);
  const [adError, setAdError] = useState(false);
  const [adIsReady, setAdIsReady] = useState(false);

  const providerTitle = shouldUseOptimalAd ? 'Optimal' : 'HypeLab';

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

  const handleAdRectSeen = useCallback(() => {
    if (lastReportedPageName !== pageName) {
      dispatch(setLastReportedPageNameAction(pageName));
      trackEvent('Internal Ads Activity', AnalyticsEventCategory.General, {
        variant,
        page: pageName,
        provider: providerTitle,
        accountPkh
      });
    }
  }, [providerTitle, lastReportedPageName, variant, pageName, accountPkh, trackEvent, dispatch]);

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

  const handleAdReady = useCallback(() => setAdIsReady(true), []);

  if (!shouldShowPartnersPromo || adError || isHiddenTemporarily) {
    return null;
  }

  return (
    <div className={clsx('w-full relative', !adIsReady && (isImageAd ? styles.imageAdLoading : styles.textAdLoading))}>
      {shouldUseOptimalAd ? (
        <OptimalPromotion
          variant={variant}
          providerTitle={providerTitle}
          pageName={pageName}
          isVisible={adIsReady}
          onAdRectSeen={handleAdRectSeen}
          onClose={handleClosePartnersPromoClick}
          onReady={handleAdReady}
          onError={handleOptimalError}
        />
      ) : (
        <HypelabPromotion
          variant={variant}
          providerTitle={providerTitle}
          pageName={pageName}
          isVisible={adIsReady}
          onAdRectSeen={handleAdRectSeen}
          onClose={handleClosePartnersPromoClick}
          onReady={handleAdReady}
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
