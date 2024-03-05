import React, { FC, MouseEventHandler, PropsWithChildren, useMemo, useRef } from 'react';

import clsx from 'clsx';

import { Anchor } from 'app/atoms/Anchor';
import { useAdRectObservation } from 'app/hooks/ads/use-ad-rect-observation';
import { useAccount } from 'lib/temple/front';

import { PartnersPromotionSelectors } from '../index.selectors';
import { PartnersPromotionVariant } from '../types';

import { CloseButton } from './close-button';

interface TextPromotionViewProps extends PropsWithChildren {
  pageName: string;
  providerTitle: string;
  href: string;
  isVisible: boolean;
  onAdRectSeen: EmptyFn;
  onClose: MouseEventHandler<HTMLButtonElement>;
}

export const ImagePromotionView: FC<TextPromotionViewProps> = ({
  pageName,
  providerTitle,
  children,
  href,
  isVisible,
  onAdRectSeen,
  onClose
}) => {
  const { publicKeyHash: accountPkh } = useAccount();

  const ref = useRef<HTMLAnchorElement>(null);
  useAdRectObservation(ref, onAdRectSeen, isVisible);

  const testIDProperties = useMemo(
    () => ({ variant: PartnersPromotionVariant.Image, page: pageName, provider: providerTitle, href, accountPkh }),
    [href, accountPkh, providerTitle, pageName]
  );

  return (
    <Anchor
      className={clsx(
        'relative w-full flex justify-center items-center rounded-xl',
        'min-h-28 bg-gray-100 hover:bg-gray-200',
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

      <div
        className={clsx(
          'absolute top-0 left-0 px-3 rounded-tl-lg rounded-br-lg ',
          'bg-blue-500 text-2xs leading-snug font-semibold text-white'
        )}
      >
        AD
      </div>
      <CloseButton className="absolute top-2 right-2" onClick={onClose} variant={PartnersPromotionVariant.Image} />
    </Anchor>
  );
};
