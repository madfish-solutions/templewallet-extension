import type { AdsProviderTitle } from 'lib/ads';

import type { PartnersPromotionVariant } from './types';

/** In Tailwind spacing units */
export const AD_BANNER_HEIGHT = 28;

export const buildAdClickAnalyticsProperties = (
  variant: PartnersPromotionVariant,
  providerTitle: AdsProviderTitle,
  pageName: string,
  accountPkh: string,
  href: string
) => ({
  variant,
  provider: providerTitle,
  page: pageName,
  accountPkh,
  href
});
