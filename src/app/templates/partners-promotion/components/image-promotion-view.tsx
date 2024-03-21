import React, { FC, MouseEventHandler, PropsWithChildren, useMemo, useRef } from 'react';

import clsx from 'clsx';

import { Anchor } from 'app/atoms/Anchor';
import { useAdRectObservation } from 'app/hooks/ads/use-ad-rect-observation';
import type { AdsProviderTitle } from 'lib/ads';
import { useAccountPkh } from 'lib/temple/front';

import { PartnersPromotionSelectors } from '../selectors';
import { PartnersPromotionVariant } from '../types';
import { AD_BANNER_HEIGHT, buildAdClickAnalyticsProperties } from '../utils';

import { CloseButton } from './close-button';

interface Props extends PropsWithChildren {
  href: string;
  isVisible: boolean;
  providerTitle: AdsProviderTitle;
  pageName: string;
  onAdRectSeen: EmptyFn;
  onClose: MouseEventHandler<HTMLButtonElement>;
}

export const ImagePromotionView: FC<Props> = ({
  children,
  href,
  isVisible,
  providerTitle,
  pageName,
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
        'relative w-full flex justify-center items-center rounded-xl',
        `min-h-${AD_BANNER_HEIGHT}`,
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
      {children}

      <ImageAdLabel />

      <CloseButton onClick={onClose} variant={PartnersPromotionVariant.Image} />
    </Anchor>
  );
};

export const ImageAdLabel: FC = () => (
  <div
    className={clsx(
      'absolute top-0 left-0 px-3 rounded-tl-lg rounded-br-lg ',
      'bg-blue-500 text-2xs leading-snug font-semibold text-white'
    )}
  >
    AD
  </div>
);
