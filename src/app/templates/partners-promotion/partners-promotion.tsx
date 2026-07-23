import { Ref, memo, MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import clsx from 'clsx';
import { useDispatch } from 'react-redux';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { useAdsViewerPkh } from 'app/hooks/use-ads-viewer-addresses';
import { useRewardsAddresses } from 'app/hooks/use-rewards-addresses';
import { hidePromotionAction } from 'app/store/partners-promotion/actions';
import {
  useShouldShowPartnersPromoSelector,
  usePromotionHidingTimestampSelector
} from 'app/store/partners-promotion/selectors';
import { AdsProviderTitle } from 'lib/ads';
import {
  fetchEnableInternalHypelabAds,
  fetchEnableInternalSpecifyAds,
  fetchInternalBlacklistedHypelabCampaignsSlugs,
  fetchInternalUnpaidHypelabCampaignsSlugs,
  postAdImpression
} from 'lib/apis/ads-api/ads-api';
import { AD_HIDING_TIMEOUT } from 'lib/constants';
import { ENABLE_INTERNAL_HYPELAB_ADS_SYNC_INTERVAL } from 'lib/fixed-times';
import { T } from 'lib/i18n';
import { useTypedSWR } from 'lib/swr';
import { useUpdatableRef } from 'lib/ui/hooks';

import { CloseButton } from './components/close-button';
import { HypelabPromotion } from './components/hypelab-promotion';
import { SpecifyPromotion } from './components/specify-promotion';
import { PartnersPromotionVariant } from './types';

export { PartnersPromotionVariant } from './types';

interface PartnersPromotionProps {
  variant: PartnersPromotionVariant;
  /** For distinguishing the ads that should be hidden by timeout */
  id: string;
  pageName: string;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

type AdProvider = 'hypelab' | 'specify';

interface WaterfallStep {
  provider: AdProvider;
  showNonPaidAd?: boolean;
}

const WATERFALL: WaterfallStep[] = [
  { provider: 'hypelab' },
  { provider: 'specify' },
  { provider: 'hypelab', showNonPaidAd: true }
];

const shouldBeHiddenByTimeout = (hiddenAt: number) => {
  return Date.now() - hiddenAt < AD_HIDING_TIMEOUT;
};

export const PartnersPromotion = memo<PartnersPromotionProps>(({ variant, id, pageName, className, ref }) => {
  const isImageAd = variant === PartnersPromotionVariant.Image;
  const rewardsAddresses = useRewardsAddresses();
  const { evmAddress: evmViewerAddress } = useAdsViewerPkh();
  const dispatch = useDispatch();
  const hiddenAt = usePromotionHidingTimestampSelector(id);
  const shouldShowPartnersPromo = useShouldShowPartnersPromoSelector();

  const [isHiddenByTimeout, setIsHiddenByTimeout] = useState(shouldBeHiddenByTimeout(hiddenAt));
  const [stepIndex, setStepIndex] = useState(0);
  const [adIsReady, setAdIsReady] = useState(false);

  useEffect(() => {
    const newIsHiddenByTimeout = shouldBeHiddenByTimeout(hiddenAt);
    setIsHiddenByTimeout(newIsHiddenByTimeout);

    if (newIsHiddenByTimeout) {
      const timeout = setTimeout(
        () => setIsHiddenByTimeout(false),
        Math.max(Date.now() - hiddenAt + AD_HIDING_TIMEOUT, 0)
      );

      return () => clearTimeout(timeout);
    }

    return;
  }, [hiddenAt]);

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

  const { data: enableInternalSpecifyAds } = useTypedSWR('enable-internal-specify-ads', fetchEnableInternalSpecifyAds, {
    revalidateOnFocus: false,
    revalidateOnMount: true,
    revalidateOnReconnect: false,
    refreshInterval: ENABLE_INTERNAL_HYPELAB_ADS_SYNC_INTERVAL
  });

  const { data: blacklistedCampaignSlugs } = useTypedSWR(
    'blacklisted-internal-hypelab-campaigns-slugs',
    fetchInternalBlacklistedHypelabCampaignsSlugs,
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,
      revalidateOnReconnect: false,
      refreshInterval: ENABLE_INTERNAL_HYPELAB_ADS_SYNC_INTERVAL
    }
  );

  const { data: unpaidCampaignSlugs } = useTypedSWR(
    'unpaid-internal-hypelab-campaigns-slugs',
    fetchInternalUnpaidHypelabCampaignsSlugs,
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,
      revalidateOnReconnect: false,
      refreshInterval: ENABLE_INTERNAL_HYPELAB_ADS_SYNC_INTERVAL
    }
  );

  const activeSteps = useMemo(
    () =>
      WATERFALL.filter(step =>
        step.provider === 'hypelab' ? enableInternalHypelabAds !== false : enableInternalSpecifyAds !== false
      ),
    [enableInternalHypelabAds, enableInternalSpecifyAds]
  );

  const currentStep = activeSteps[stepIndex];
  const currentStepRef = useUpdatableRef(currentStep);
  const disabledKey = `${enableInternalHypelabAds === false}-${enableInternalSpecifyAds === false}`;
  const prevDisabledKeyRef = useRef(disabledKey);

  useEffect(() => {
    if (prevDisabledKeyRef.current === disabledKey) {
      return;
    }
    prevDisabledKeyRef.current = disabledKey;

    setStepIndex(0);
    setAdIsReady(false);
  }, [disabledKey]);

  const handleImpression = useCallback(() => {
    const provider =
      currentStepRef.current?.provider === 'specify' ? AdsProviderTitle.Specify : AdsProviderTitle.HypeLab;
    postAdImpression(rewardsAddresses, provider, { pageName });
  }, [pageName, rewardsAddresses, currentStepRef]);

  const handleClosePartnersPromoClick = useCallback<MouseEventHandler<HTMLButtonElement>>(
    e => {
      e.preventDefault();
      e.stopPropagation();
      dispatch(hidePromotionAction({ timestamp: Date.now(), id }));
    },
    [id, dispatch]
  );

  const handleAdReady = useCallback(() => setAdIsReady(true), []);

  const handleAdvance = useCallback(() => {
    setAdIsReady(false);
    setStepIndex(index => index + 1);
  }, []);

  const isHiddenTemporarily =
    isHiddenByTimeout || (isLoadingEnableInternalHypelabAds && enableInternalHypelabAds === undefined);

  if (!shouldShowPartnersPromo || isHiddenTemporarily || !currentStep) {
    return null;
  }

  return (
    <FadeTransition elementTransition trigger={adIsReady} className="w-full">
      <div
        ref={ref}
        className={clsx(
          'group w-full relative flex flex-col items-center',
          !adIsReady && (isImageAd ? 'min-h-25.25' : 'min-h-16'),
          className
        )}
      >
        <div className="w-full flex flex-col items-center z-10">
          {currentStep.provider === 'specify' ? (
            <SpecifyPromotion
              key={`${disabledKey}-${stepIndex}`}
              accountPkh={evmViewerAddress}
              variant={variant}
              isVisible={adIsReady}
              pageName={pageName}
              onImpression={handleImpression}
              onReady={handleAdReady}
              onError={handleAdvance}
            />
          ) : (
            <HypelabPromotion
              key={`${disabledKey}-${stepIndex}`}
              accountPkh={evmViewerAddress}
              variant={variant}
              isVisible={adIsReady}
              pageName={pageName}
              blacklistedCampaignSlugs={blacklistedCampaignSlugs}
              unpaidCampaignSlugs={unpaidCampaignSlugs}
              showNonPaidAd={currentStep.showNonPaidAd ?? false}
              onImpression={handleImpression}
              onReady={handleAdReady}
              onError={handleAdvance}
              onNoPaidAd={handleAdvance}
            />
          )}
        </div>

        <div className="absolute inset-0 bg-grey-4 text-secondary flex justify-center items-center rounded-lg">
          <span className="text-font-description-bold text-grey-2">
            <T id="thanksForSupportingTemple" />
          </span>
        </div>

        <CloseButton
          className="opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
          onClick={handleClosePartnersPromoClick}
        />
      </div>
    </FadeTransition>
  );
});
