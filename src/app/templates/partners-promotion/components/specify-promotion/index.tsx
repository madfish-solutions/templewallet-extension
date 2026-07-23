import { memo } from 'react';

import { PartnersPromotionVariant, SingleProviderPromotionProps } from '../../types';

import { SpecifyImagePromotion } from './specify-image-promotion';
import { SpecifyTextPromotion } from './specify-text-promotion';

type SpecifyPromotionProps = Omit<SingleProviderPromotionProps, 'blacklistedCampaignSlugs'>;

export const SpecifyPromotion = memo<SpecifyPromotionProps>(({ variant, ...restProps }) =>
  variant === PartnersPromotionVariant.Image ? (
    <SpecifyImagePromotion {...restProps} />
  ) : (
    <SpecifyTextPromotion {...restProps} />
  )
);
