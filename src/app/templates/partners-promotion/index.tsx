import React, { memo, MouseEventHandler, useCallback, useEffect, useRef, useState } from 'react';

import clsx from 'clsx';
import { useDispatch } from 'react-redux';

import { useAdsViewerPkh } from 'app/hooks/use-ads-viewer-pkh';
import { hidePromotionAction } from 'app/store/partners-promotion/actions';
import {
  useShouldShowPartnersPromoSelector,
  usePromotionHidingTimestampSelector
} from 'app/store/partners-promotion/selectors';
import { AdsProviderName, AdsProviderTitle } from 'lib/ads';
import { postAdImpression } from 'lib/apis/ads-api';
import { AD_HIDING_TIMEOUT } from 'lib/constants';
import { T } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';

import { CloseButton } from './components/close-button';
import { HypelabPromotion } from './components/hypelab-promotion';
import { OptimalPromotion } from './components/optimal-promotion';
import { PersonaPromotion } from './components/persona-promotion';
import { PartnersPromotionVariant } from './types';

export { PartnersPromotionVariant } from './types';

interface PartnersPromotionProps {
  variant: PartnersPromotionVariant;
  /** For distinguishing the ads that should be hidden temporarily */
  id: string;
  pageName: string;
  withPersonaProvider?: boolean;
  className?: string;
}

type AdsProviderLocalName = Exclude<AdsProviderName, 'Temple'>;

const shouldBeHiddenTemporarily = (hiddenAt: number) => {
  return Date.now() - hiddenAt < AD_HIDING_TIMEOUT;
};

export const PartnersPromotion = memo<PartnersPromotionProps>(({ variant, id, pageName, withPersonaProvider }) => {
  const isImageAd = variant === PartnersPromotionVariant.Image;
  const adsViewerAddress = useAdsViewerPkh();
  const dispatch = useDispatch();
  const hiddenAt = usePromotionHidingTimestampSelector(id);
  const shouldShowPartnersPromo = useShouldShowPartnersPromoSelector();

  const isAnalyticsSentRef = useRef(false);

  const [hovered, setHovered, setUnhovered] = useBooleanState(false);
  const [isHiddenTemporarily, setIsHiddenTemporarily] = useState(shouldBeHiddenTemporarily(hiddenAt));
  const [providerName, setProviderName] = useState<AdsProviderLocalName>('Optimal');
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

  const handleAdRectSeen = useCallback(() => {
    if (isAnalyticsSentRef.current) return;

    postAdImpression(adsViewerAddress, AdsProviderTitle[providerName], { pageName });

    isAnalyticsSentRef.current = true;
  }, [providerName, pageName, adsViewerAddress]);

  const handleClosePartnersPromoClick = useCallback<MouseEventHandler<HTMLButtonElement>>(
    e => {
      e.preventDefault();
      e.stopPropagation();
      dispatch(hidePromotionAction({ timestamp: Date.now(), id }));
    },
    [id, dispatch]
  );

  const handleOptimalError = useCallback(() => setProviderName('HypeLab'), []);
  const handleHypelabError = useCallback(
    () => (withPersonaProvider ? setProviderName('Persona') : setAdError(true)),
    [withPersonaProvider]
  );
  const handlePersonaError = useCallback(() => setAdError(true), []);

  const handleAdReady = useCallback(() => setAdIsReady(true), []);

  if (!shouldShowPartnersPromo || adError || isHiddenTemporarily) {
    return null;
  }

  return (
    <div
      className={clsx(
        'w-full relative flex flex-col items-center',
        !adIsReady && (isImageAd ? 'min-h-[101px]' : 'min-h-16')
      )}
      onMouseEnter={setHovered}
      onMouseLeave={setUnhovered}
    >
      {(() => {
        switch (providerName) {
          case 'Optimal':
            return (
              <OptimalPromotion
                accountPkh={adsViewerAddress}
                variant={variant}
                isVisible={adIsReady}
                pageName={pageName}
                onAdRectSeen={handleAdRectSeen}
                onReady={handleAdReady}
                onError={handleOptimalError}
              />
            );
          case 'HypeLab':
            return (
              <HypelabPromotion
                accountPkh={adsViewerAddress}
                variant={variant}
                isVisible={adIsReady}
                pageName={pageName}
                onAdRectSeen={handleAdRectSeen}
                onReady={handleAdReady}
                onError={handleHypelabError}
              />
            );
          case 'Persona':
            return (
              <PersonaPromotion
                accountPkh={adsViewerAddress}
                id={id}
                isVisible={adIsReady}
                pageName={pageName}
                onAdRectSeen={handleAdRectSeen}
                onReady={handleAdReady}
                onError={handlePersonaError}
              />
            );
        }
      })()}

      {!adIsReady && (
        <div className="absolute inset-0 bg-grey-4 text-secondary flex justify-center items-center rounded-lg">
          <span className="text-font-description-bold text-grey-2">
            <T id="thanksForSupportingTemple" />
          </span>
        </div>
      )}

      {hovered && <CloseButton onClick={handleClosePartnersPromoClick} />}
    </div>
  );
});
