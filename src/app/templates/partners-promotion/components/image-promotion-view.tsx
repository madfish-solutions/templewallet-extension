import React, { FC, MouseEventHandler, PropsWithChildren, useMemo, useRef } from 'react';

import clsx from 'clsx';

import { Anchor } from 'app/atoms/Anchor';
import { useAdRectObservation } from 'app/hooks/ads/use-ad-rect-observation';
import type { AdsProviderTitle } from 'lib/ads';
import { useAccountPkh } from 'lib/temple/front';

import { PartnersPromotionSelectors } from '../selectors';
import { PartnersPromotionVariant } from '../types';
import { buildAdClickAnalyticsProperties } from '../utils';

import { CloseButton } from './close-button';

interface Props extends PropsWithChildren {
  href: string;
  isVisible: boolean;
  providerTitle: AdsProviderTitle;
  pageName: string;
  backgroundAssetUrl?: string;
  backgroundAssetType?: 'image' | 'video';
  onAdRectSeen: EmptyFn;
  onClose: MouseEventHandler<HTMLButtonElement>;
}

export const ImagePromotionView: FC<Props> = ({
  children,
  href,
  isVisible,
  providerTitle,
  pageName,
  backgroundAssetUrl,
  backgroundAssetType = 'image',
  onAdRectSeen,
  onClose
}) => {
  const accountPkh = useAccountPkh();

  const ref = useRef<HTMLAnchorElement>(null);
  useAdRectObservation(ref, onAdRectSeen, isVisible);

  const testIDProperties = useMemo(
    () => buildAdClickAnalyticsProperties(PartnersPromotionVariant.Image, providerTitle, pageName, accountPkh, href),
    [href, providerTitle, pageName, accountPkh]
  );

  return (
    <Anchor
      className={clsx(
        'relative w-full rounded-xl overflow-hidden',
        'bg-gray-100 hover:bg-gray-200',
        !isVisible && 'invisible'
      )}
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
              className="absolute inset-0 w-full h-full object-cover filter blur-md"
              src={backgroundAssetUrl}
              alt=""
            />
          ) : (
            <video
              className="absolute inset-0 w-full h-full object-cover filter blur-md"
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

      <div className="w-full flex justify-center items-center z-10 relative">{children}</div>

      <ImageAdLabel />

      <CloseButton onClick={onClose} variant={PartnersPromotionVariant.Image} />
    </Anchor>
  );
};

const ImageAdLabel: FC = () => (
  <div
    className={clsx(
      'absolute top-0 left-0 px-3 rounded-tl-xl rounded-br-xl z-20',
      'bg-blue-500 text-2xs leading-snug font-semibold text-white'
    )}
  >
    AD
  </div>
);
