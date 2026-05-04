import React, { useMemo } from 'react';

import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { usePartnersPromotionModule } from 'app/templates/partners-promotion';
import { useAdsConstantsModule } from 'lib/ads-constants';
import { t } from 'lib/i18n/react';
import { withSuspense } from 'lib/ui/with-suspense';

interface Props extends PropsWithChildren {
  chainId?: string | number;
  assetSlug?: string;
}

export const ActivityListContainer = withSuspense<Props>(
  ({ children, chainId, assetSlug }) => {
    const partnersPromotionModule = usePartnersPromotionModule();
    const adsConstantsModule = useAdsConstantsModule();

    const shouldShowPartnersPromo = useShouldShowPartnersPromoSelector();

    const promotion = useMemo(() => {
      if (!partnersPromotionModule || !adsConstantsModule) return null;

      const { PartnersPromotion, PartnersPromotionVariant } = partnersPromotionModule;
      const { ACTIVITY_PAGE_NAME, TOKEN_PAGE_NAME } = adsConstantsModule;
      const pageName = assetSlug ? TOKEN_PAGE_NAME : ACTIVITY_PAGE_NAME;

      if (shouldShowPartnersPromo)
        return (
          <PartnersPromotion
            id={['promo-activity', chainId ?? 'multi', assetSlug ?? 'all'].join('-')}
            variant={PartnersPromotionVariant.Image}
            pageName={pageName}
            className="mb-4"
          />
        );

      // TODO: Update banner UI
      // return assetSlug === TEMPLE_TOKEN_SLUG ? <ReactivateAdsBanner /> : null;
      return null;
    }, [shouldShowPartnersPromo, chainId, assetSlug, partnersPromotionModule, adsConstantsModule]);

    return (
      <div className="grow flex flex-col">
        {promotion}

        {children}
      </div>
    );
  },
  { errorMessage: t('operationHistoryWhileMessage') }
);
