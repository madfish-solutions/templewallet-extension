import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';

import { Button, IconBase } from 'app/atoms';
import { TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { ReactComponent as ChevronRightIcon } from 'app/icons/base/chevron_right.svg';
import { useTokenApyRateSelector } from 'app/store/d-apps';
import { TezosAssetIcon } from 'app/templates/AssetIcon';
import { setTestID } from 'lib/analytics';
import { T } from 'lib/i18n';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { openLink } from 'lib/utils';
import { navigate } from 'lib/woozie';

import {
  EARN_OPPORTUNITIES,
  VISIBLE_ITEMS_COUNT,
  CAROUSEL_INTERVAL_MS,
  CAROUSEL_TRANSITION_MS,
  EarnOpportunity
} from './config';
import { EarnSectionSelectors } from './selectors';

const EARN_PAGE_PATH = '/earn';

interface EarnSectionProps {
  className?: string;
}

export const EarnSection = memo<EarnSectionProps>(({ className }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const totalItems = EARN_OPPORTUNITIES.length;
  const maxIndex = Math.max(0, totalItems - VISIBLE_ITEMS_COUNT);

  // Auto-rotate carousel
  useEffect(() => {
    if (totalItems <= VISIBLE_ITEMS_COUNT) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
        setIsTransitioning(false);
      }, CAROUSEL_TRANSITION_MS);
    }, CAROUSEL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [totalItems, maxIndex]);

  const visibleItems = useMemo(
    () => EARN_OPPORTUNITIES.slice(currentIndex, currentIndex + VISIBLE_ITEMS_COUNT),
    [currentIndex]
  );

  const handleHeaderClick = useCallback(() => {
    navigate(EARN_PAGE_PATH);
  }, []);

  return (
    <div className={clsx('flex flex-col', className)}>
      {/* Stacked cards container */}
      <div className="relative pb-[68px]">
        {/* Background placeholder card - Crypto Card */}
        <CryptoCardPlaceholder />

        {/* Earn section card (foreground) */}
        <div className="relative -mb-[68px] px-4" {...setTestID(EarnSectionSelectors.earnSectionCard)}>
          <div className="bg-white border-0.5 border-lines rounded-lg flex flex-col pt-0 pb-1 px-1">
            {/* Header */}
            <Button
              className="flex items-center justify-between p-2 rounded-8 overflow-hidden"
              onClick={handleHeaderClick}
              testID={EarnSectionSelectors.earnSectionHeader}
            >
              <span className="text-font-description-bold p-1">
                <T id="earn" />
              </span>
              <IconBase Icon={ChevronRightIcon} className="text-primary" />
            </Button>

            {/* Carousel Items Container */}
            <div className="bg-background rounded-lg px-3 pt-3 pb-2">
              <div
                className={clsx(
                  'grid grid-cols-2 gap-2 h-8 transition-opacity',
                  isTransitioning ? 'opacity-0' : 'opacity-100'
                )}
                style={{ transitionDuration: `${CAROUSEL_TRANSITION_MS}ms` }}
              >
                {visibleItems.map(opportunity => (
                  <EarnOpportunityItem key={opportunity.slug} opportunity={opportunity} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

interface EarnOpportunityItemProps {
  opportunity: EarnOpportunity;
}

const EarnOpportunityItem = memo<EarnOpportunityItemProps>(({ opportunity }) => {
  const { slug, symbol, rateType, link, fallbackRate } = opportunity;

  const dynamicRate = useTokenApyRateSelector(slug);
  const rate = dynamicRate ?? fallbackRate;

  const displayRate = useMemo(() => {
    if (!rate) return null;
    return Number(new BigNumber(rate).decimalPlaces(1));
  }, [rate]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      openLink(link);
    },
    [link]
  );

  if (!displayRate) return null;

  return (
    <Button
      className="flex items-center justify-center gap-2"
      onClick={handleClick}
      testID={EarnSectionSelectors.earnOpportunityItem}
      testIDProperties={{ slug, symbol, rate: displayRate }}
    >
      {/* Token icon with network badge */}
      <div className="relative p-1">
        <TezosAssetIcon assetSlug={slug} tezosChainId={TEZOS_MAINNET_CHAIN_ID} size={24} className="rounded-full" />
        <div className="absolute bottom-0 right-0 bg-white border-0.5 border-lines rounded-full p-0.5">
          <TezosNetworkLogo chainId={TEZOS_MAINNET_CHAIN_ID} size={12} />
        </div>
      </div>

      {/* Symbol and rate */}
      <div className="flex items-center gap-1 text-font-description whitespace-nowrap">
        <span className="font-semibold text-text">{symbol}</span>
        <span className="text-grey-1">
          {displayRate}% {rateType}
        </span>
      </div>
    </Button>
  );
});

/**
 * TODO: Replace with actual implementation.
 */
const CryptoCardPlaceholder = memo(() => (
  <div className="h-24 mx-6 -mb-[68px] rounded-8 px-4 py-3 bg-primary">
    <span className="text-font-description-bold text-white">Crypto card</span>
  </div>
));
