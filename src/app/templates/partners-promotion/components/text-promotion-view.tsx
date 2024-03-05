import React, { memo, MouseEventHandler, useMemo, useRef } from 'react';

import clsx from 'clsx';

import { Anchor } from 'app/atoms/Anchor';
import { useAppEnv } from 'app/env';
import { useAdRectObservation } from 'app/hooks/ads/use-ad-rect-observation';
import { useAccount } from 'lib/temple/front';

import { PartnersPromotionSelectors } from '../index.selectors';
import { PartnersPromotionVariant } from '../types';

import { CloseButton } from './close-button';

interface TextPromotionViewProps {
  pageName: string;
  providerTitle: string;
  href: string;
  isVisible: boolean;
  imageSrc: string;
  headline: string;
  contentText?: string;
  onAdRectSeen: EmptyFn;
  onImageError: EmptyFn;
  onClose: MouseEventHandler<HTMLButtonElement>;
}

export const TextPromotionView = memo<TextPromotionViewProps>(
  ({
    pageName,
    providerTitle,
    imageSrc,
    href,
    headline,
    isVisible,
    contentText = '',
    onAdRectSeen,
    onImageError,
    onClose
  }) => {
    const { popup } = useAppEnv();
    const { publicKeyHash: accountPkh } = useAccount();

    const truncatedContentText = useMemo(
      () => (contentText.length > 80 ? `${contentText.slice(0, 80)}...` : contentText),
      [contentText]
    );

    const ref = useRef<HTMLAnchorElement>(null);
    useAdRectObservation(ref, onAdRectSeen, isVisible);

    const testIDProperties = useMemo(
      () => ({ variant: PartnersPromotionVariant.Text, page: pageName, provider: providerTitle, href, accountPkh }),
      [href, accountPkh, providerTitle, pageName]
    );

    return (
      <Anchor
        className={clsx(
          'relative w-full flex justify-center items-center bg-gray-100 hover:bg-gray-200',
          !popup && 'rounded-xl',
          !isVisible && 'invisible'
        )}
        href={href}
        target="_blank"
        rel="noreferrer"
        ref={ref}
        testID={PartnersPromotionSelectors.promoLink}
        testIDProperties={testIDProperties}
      >
        <div className="flex items-center justify-start gap-2.5 p-4 max-w-sm w-full">
          <div className="self-stretch">
            <img className="h-8 w-8 rounded-circle" src={imageSrc} alt="Partners promotion" onError={onImageError} />
          </div>
          <div className="flex-1 flex flex-col gap-1 justify-center">
            <div className="flex">
              <div className="flex flex-1 pr-2.5">
                <span className="text-gray-910 font-medium leading-tight mr-2.5">{headline}</span>
                <div
                  className={clsx(
                    'flex items-center bg-blue-600 rounded px-1.5 h-4',
                    'text-white text-xxxs font-medium leading-none'
                  )}
                >
                  AD
                </div>
              </div>
              <CloseButton onClick={onClose} variant={PartnersPromotionVariant.Text} />
            </div>
            {truncatedContentText && (
              <span className="text-xs text-gray-600 pr-6 leading-5">{truncatedContentText}</span>
            )}
          </div>
        </div>
      </Anchor>
    );
  }
);
