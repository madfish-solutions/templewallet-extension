import React, { FC, memo } from 'react';

import { PartnersPromotionVariant, SingleProviderPromotionProps } from '../../types';

import { HypelabImagePromotion } from './hypelab-image-promotion';
import { HypelabTextPromotion } from './hypelab-text-promotion';

export const HypelabPromotion: FC<SingleProviderPromotionProps> = memo(({ variant, ...restProps }) =>
  variant === PartnersPromotionVariant.Image ? (
    <HypelabImagePromotion {...restProps} />
  ) : (
    <HypelabTextPromotion {...restProps} />
  )
);
