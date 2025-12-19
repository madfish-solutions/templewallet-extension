import React, { PropsWithChildren, memo, useMemo, useRef } from 'react';

import clsx from 'clsx';

import { Anchor } from 'app/atoms/Anchor';
import { useAdRectObservation } from 'app/hooks/ads/use-ad-rect-observation';
import type { AdsProviderTitle } from 'lib/ads';

import { PartnersPromotionSelectors } from '../selectors';
import { PartnersPromotionVariant } from '../types';
import { buildAdClickAnalyticsProperties } from '../utils';

interface Props extends PropsWithChildren {
  accountPkh: string;
  href: string;
  isVisible: boolean;
  providerTitle: AdsProviderTitle;
  pageName: string;
  backgroundAssetUrl?: string;
  backgroundAssetType?: 'image' | 'video';
  onAdRectVisible: SyncFn<boolean>;
}

export const ImagePromotionView = memo<Props>(
  ({
    accountPkh,
    children,
    href,
    isVisible,
    providerTitle,
    pageName,
    backgroundAssetUrl,
    backgroundAssetType = 'image',
    onAdRectVisible
  }) => {
    const ref = useRef<HTMLAnchorElement>(null);
    useAdRectObservation(ref, onAdRectVisible, isVisible);

    const testIDProperties = useMemo(
      () => buildAdClickAnalyticsProperties(PartnersPromotionVariant.Image, providerTitle, pageName, accountPkh, href),
      [href, providerTitle, pageName, accountPkh]
    );

    return (
      <Anchor
        className={clsx('relative w-full h-[101px] rounded-lg overflow-hidden bg-grey-4', !isVisible && 'invisible')}
        href={href}
        target="_blank"
        rel="noreferrer"
        ref={ref}
        testID={PartnersPromotionSelectors.promoLink}
        testIDProperties={testIDProperties}
      >
        {backgroundAssetUrl && (
          <>
            {backgroundAssetType === 'image' ? (
              <img
                className="absolute inset-0 w-full h-full object-cover filter blur-[20px]"
                src={backgroundAssetUrl}
                alt=""
              />
            ) : (
              <video
                className="absolute inset-0 w-full h-full object-cover filter blur-[20px]"
                src={backgroundAssetUrl}
                autoPlay
                preload="auto"
                playsInline
                muted
                loop
              />
            )}
          </>
        )}

        <div className="w-full h-full flex justify-center items-center z-10 relative">{children}</div>

        <ImageAdLabel />
      </Anchor>
    );
  }
);

const ImageAdLabel = memo(() => (
  <div
    className={clsx(
      'absolute top-0 left-0 p-1 rounded-tl-lg rounded-br-lg z-20',
      'bg-secondary text-font-small-bold text-white'
    )}
  >
    AD
  </div>
));
