import { createEntity } from 'lib/store';

import { PartnersPromotionState } from './state';

export const mockPartnersPromotion = {
  body: '',
  campaign_type: '',
  copy: {
    headline: '',
    cta: '',
    content: ''
  },
  display_type: '',
  div_id: '',
  html: [],
  id: '',
  image: '',
  link: '',
  nonce: '',
  text: '',
  view_time_url: '',
  view_url: ''
};

export const mockPartnersPromotionState: PartnersPromotionState = {
  promotion: createEntity(mockPartnersPromotion),
  shouldShowPromotion: true
};
