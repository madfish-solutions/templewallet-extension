import React, { forwardRef, memo, MouseEventHandler, useCallback, useEffect, useRef, useState } from 'react';

import clsx from 'clsx';
import { useDispatch } from 'react-redux';

import { useAdsViewerPkh } from 'app/hooks/use-ads-viewer-addresses';
import { useRewardsAddresses } from 'app/hooks/use-rewards-addresses';
import { hidePromotionAction } from 'app/store/partners-promotion/actions';
import {
  useShouldShowPartnersPromoSelector,
  usePromotionHidingTimestampSelector
} from 'app/store/partners-promotion/selectors';
import { AdsProviderName, AdsProviderTitle } from 'lib/ads';
import { fetchEnableInternalHypelabAds, postAdImpression } from 'lib/apis/ads-api';
import { AD_HIDING_TIMEOUT } from 'lib/constants';
import { ENABLE_INTERNAL_HYPELAB_ADS_SYNC_INTERVAL } from 'lib/fixed-times';
import { T } from 'lib/i18n';
import { useTypedSWR } from 'lib/swr';

import { CloseButton } from './components/close-button';
import { HypelabPromotion } from './components/hypelab-promotion';
import { PersonaPromotion } from './components/persona-promotion';
import { PartnersPromotionVariant } from './types';

export { PartnersPromotionVariant } from './types';

interface PartnersPromotionProps {
  variant: PartnersPromotionVariant;
  /** For distinguishing the ads that should be hidden by timeout */
  id: string;
  pageName: string;
  withPersonaProvider?: boolean;
  className?: string;
}

type AdsProviderLocalName = Exclude<AdsProviderName, 'Temple'>;

const shouldBeHiddenByTimeout = (hiddenAt: number) => {
  return Date.now() - hiddenAt < AD_HIDING_TIMEOUT;
};

export const PartnersPromotion = memo(
  forwardRef<HTMLDivElement, PartnersPromotionProps>(
    ({ variant, id, pageName, withPersonaProvider, className }, ref) => {
      const isImageAd = variant === PartnersPromotionVariant.Image;
      const rewardsAddresses = useRewardsAddresses();
      const { evmAddress: evmViewerAddress } = useAdsViewerPkh();
      const dispatch = useDispatch();
      const hiddenAt = usePromotionHidingTimestampSelector(id);
      const shouldShowPartnersPromo = useShouldShowPartnersPromoSelector();

      const isAnalyticsSentRef = useRef(false);

      const [isHiddenByTimeout, setIsHiddenByTimeout] = useState(shouldBeHiddenByTimeout(hiddenAt));
      const [providerName, setProviderName] = useState<AdsProviderLocalName>('HypeLab');
      const [adError, setAdError] = useState(false);
      const [adIsReady, setAdIsReady] = useState(false);

      useEffect(() => {
        const newIsHiddenTemporarily = shouldBeHiddenByTimeout(hiddenAt);
        setIsHiddenByTimeout(newIsHiddenTemporarily);

        if (newIsHiddenTemporarily) {
          const timeout = setTimeout(
            () => setIsHiddenByTimeout(false),
            Math.max(Date.now() - hiddenAt + AD_HIDING_TIMEOUT, 0)
          );

          return () => clearTimeout(timeout);
        }

        return;
      }, [hiddenAt]);

      const handleAdRectSeen = useCallback(() => {
        if (isAnalyticsSentRef.current) return;

        postAdImpression(rewardsAddresses, AdsProviderTitle[providerName], { pageName });

        isAnalyticsSentRef.current = true;
      }, [providerName, pageName, rewardsAddresses]);

      const handleClosePartnersPromoClick = useCallback<MouseEventHandler<HTMLButtonElement>>(
        e => {
          e.preventDefault();
          e.stopPropagation();
          dispatch(hidePromotionAction({ timestamp: Date.now(), id }));
        },
        [id, dispatch]
      );

      const handleHypelabError = useCallback(
        () => (withPersonaProvider ? setProviderName('Persona') : setAdError(true)),
        [withPersonaProvider]
      );
      const handlePersonaError = useCallback(() => setAdError(true), []);

      const handleAdReady = useCallback(() => setAdIsReady(true), []);

      const { data: enableInternalHypelabAds, isLoading: isLoadingEnableInternalHypelabAds } = useTypedSWR(
        'enable-internal-hypelab-ads',
        fetchEnableInternalHypelabAds,
        {
          revalidateOnFocus: false,
          revalidateOnMount: true,
          revalidateOnReconnect: false,
          refreshInterval: ENABLE_INTERNAL_HYPELAB_ADS_SYNC_INTERVAL
        }
      );
      const prevEnableInternalHypelabAdsRef = useRef(enableInternalHypelabAds);

      const isHiddenTemporarily =
        isHiddenByTimeout ||
        (isLoadingEnableInternalHypelabAds && enableInternalHypelabAds === undefined && providerName === 'HypeLab');

      useEffect(() => {
        const prevEnableInternalHypelabAds = prevEnableInternalHypelabAdsRef.current;
        prevEnableInternalHypelabAdsRef.current = enableInternalHypelabAds;
        if (enableInternalHypelabAds === false && providerName === 'HypeLab') {
          handleHypelabError();
        }
        if (prevEnableInternalHypelabAds === false && enableInternalHypelabAds) {
          setAdIsReady(false);
          setProviderName('HypeLab');
          setAdError(false);
        }
      }, [enableInternalHypelabAds, handleHypelabError, providerName]);

      if (!shouldShowPartnersPromo || adError || isHiddenTemporarily) {
        return null;
      }

      return (
        <div
          ref={ref}
          className={clsx(
            'group w-full relative flex flex-col items-center',
            !adIsReady && (isImageAd ? 'min-h-[101px]' : 'min-h-16'),
            className
          )}
        >
          {(() => {
            switch (providerName) {
              case 'HypeLab':
                return (
                  <HypelabPromotion
                    accountPkh={evmViewerAddress}
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
                    accountPkh={evmViewerAddress}
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

          <CloseButton
            className="opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
            onClick={handleClosePartnersPromoClick}
          />
        </div>
      );
    }
  )
);
