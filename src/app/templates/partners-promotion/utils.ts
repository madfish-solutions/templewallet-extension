import type { AdsProviderTitle } from 'lib/ads';

import type { PartnersPromotionVariant } from './types';

export const buildAdClickAnalyticsProperties = (
  variant: PartnersPromotionVariant,
  providerTitle: AdsProviderTitle,
  pageName: string,
  href: string
) => ({
  variant,
  provider: providerTitle,
  page: pageName,
  href
});
