import React, { useMemo } from 'react';

import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { usePartnersPromotionModule } from 'app/templates/partners-promotion';
import { ACTIVITY_PAGE_NAME, TOKEN_PAGE_NAME } from 'lib/ads-constants';
import { t } from 'lib/i18n/react';
import { withSuspense } from 'lib/ui/with-suspense';

interface Props extends PropsWithChildren {
  chainId?: string | number;
  assetSlug?: string;
}

export const ActivityListContainer = withSuspense<Props>(
  ({ children, chainId, assetSlug }) => {
    const partnersPromotionModule = usePartnersPromotionModule();
    const pageName = assetSlug ? TOKEN_PAGE_NAME : ACTIVITY_PAGE_NAME;

    const shouldShowPartnersPromo = useShouldShowPartnersPromoSelector();

    const promotion = useMemo(() => {
      if (!partnersPromotionModule) return null;

      const { PartnersPromotion, PartnersPromotionVariant } = partnersPromotionModule;

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
    }, [shouldShowPartnersPromo, chainId, assetSlug, pageName, partnersPromotionModule]);

    return (
      <div className="flex-grow flex flex-col">
        {promotion}

        {children}
      </div>
    );
  },
  { errorMessage: t('operationHistoryWhileMessage') }
);
