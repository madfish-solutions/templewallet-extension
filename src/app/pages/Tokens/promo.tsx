import { FC, Ref } from 'react';

import { usePartnersPromotionModule } from 'app/templates/partners-promotion';
import { useAdsConstantsModule } from 'lib/ads-constants';

export const Promo: FC<{ ref: Ref<HTMLDivElement> }> = ({ ref }) => {
  const PartnersPromotionModule = usePartnersPromotionModule();
  const AdsConstantsModule = useAdsConstantsModule();

  if (!PartnersPromotionModule || !AdsConstantsModule) {
    return null;
  }

  return (
    <PartnersPromotionModule.PartnersPromotion
      id="promo-token-item"
      key="promo-token-item"
      variant={PartnersPromotionModule.PartnersPromotionVariant.Text}
      pageName={AdsConstantsModule.TOKENS_PAGE_NAME}
      ref={ref}
    />
  );
};
