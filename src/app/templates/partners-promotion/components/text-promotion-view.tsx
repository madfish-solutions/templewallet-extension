import React, { memo, useMemo, useRef } from 'react';

import clsx from 'clsx';

import { Anchor } from 'app/atoms/Anchor';
import { useAdRectObservation } from 'app/hooks/ads/use-ad-rect-observation';
import type { AdsProviderTitle } from 'lib/ads';

import { PartnersPromotionSelectors } from '../selectors';
import { PartnersPromotionVariant } from '../types';
import { buildAdClickAnalyticsProperties } from '../utils';

interface Props {
  accountPkh: string;
  href: string;
  isVisible: boolean;
  imageSrc: string;
  headline: string;
  contentText?: string;
  providerTitle: AdsProviderTitle;
  pageName: string;
  onAdRectSeen: EmptyFn;
  onImageError: EmptyFn;
}

export const TextPromotionView = memo<Props>(
  ({
    accountPkh,
    imageSrc,
    href,
    headline,
    isVisible,
    contentText = '',
    providerTitle,
    pageName,
    onAdRectSeen,
    onImageError
  }) => {
    const ref = useRef<HTMLAnchorElement>(null);
    useAdRectObservation(ref, onAdRectSeen, isVisible);

    const testIDProperties = useMemo(
      () => buildAdClickAnalyticsProperties(PartnersPromotionVariant.Text, providerTitle, pageName, accountPkh, href),
      [href, providerTitle, pageName, accountPkh]
    );

    return (
      <Anchor
        className={clsx('rounded-lg relative w-full flex bg-grey-4 hover:bg-secondary-low', !isVisible && 'invisible')}
        href={href}
        target="_blank"
        rel="noreferrer"
        ref={ref}
        testID={PartnersPromotionSelectors.promoLink}
        testIDProperties={testIDProperties}
      >
        <div className="w-full flex-1 flex gap-2 p-2 pr-9">
          <div className="shrink-0">
            <img
              className="w-10 h-auto p-1 rounded-circle"
              src={imageSrc}
              alt="Partners promotion"
              onError={onImageError}
            />
          </div>

          <div className="flex-1 flex flex-col gap-1 justify-center overflow-hidden">
            <div className="flex gap-1 items-center">
              <span className="text-font-medium truncate">{headline}</span>
              <div className="bg-secondary text-white text-font-small-bold px-1 py-0.5 rounded">AD</div>
            </div>

            {contentText && <span className="text-font-description text-grey-1 line-clamp-2">{contentText}</span>}
          </div>
        </div>
      </Anchor>
    );
  }
);
