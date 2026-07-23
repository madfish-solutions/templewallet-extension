import React, { memo } from 'react';

import { HypelabPromotionProps, PartnersPromotionVariant } from '../../types';

import { HypelabImagePromotion } from './hypelab-image-promotion';
import { HypelabTextPromotion } from './hypelab-text-promotion';

export const HypelabPromotion = memo<HypelabPromotionProps>(({ variant, ...restProps }) =>
  variant === PartnersPromotionVariant.Image ? (
    <HypelabImagePromotion {...restProps} />
  ) : (
    <HypelabTextPromotion {...restProps} />
  )
);
