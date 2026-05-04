import React, { FC } from 'react';

import { EmptyState } from 'app/atoms/EmptyState';
import { usePartnersPromotionModule } from 'app/templates/partners-promotion';
import { useAdsConstantsModule } from 'lib/ads-constants';
import type { CustomDAppInfo } from 'lib/apis/temple/endpoints/get-dapps-list';

import { DappItem } from './DappItem';

interface DappsListProps {
  matchingDApps: CustomDAppInfo[];
}

export const DappsList: FC<DappsListProps> = ({ matchingDApps }) => {
  const PartnersPromotionModule = usePartnersPromotionModule();
  const AdsConstantsModule = useAdsConstantsModule();

  const dappsJsx = matchingDApps.map(dAppProps => <DappItem {...dAppProps} key={dAppProps.slug} />);

  if (PartnersPromotionModule && AdsConstantsModule) {
    const { PartnersPromotion, PartnersPromotionVariant } = PartnersPromotionModule;

    const promoJsx = (
      <PartnersPromotion
        id="promo-dapp-item"
        key="promo-dapp-item"
        variant={PartnersPromotionVariant.Text}
        pageName={AdsConstantsModule.DAPPS_PAGE_NAME}
      />
    );

    if (matchingDApps.length < 5) {
      dappsJsx.push(promoJsx);
    } else {
      dappsJsx.splice(1, 0, promoJsx);
    }
  }

  return matchingDApps.length ? <div className="flex flex-col gap-y-3">{dappsJsx}</div> : <EmptyState stretch />;
};
