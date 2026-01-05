import React, { FC, useMemo } from 'react';

import { EmptyState } from 'app/atoms/EmptyState';
import { usePartnersPromotionModule } from 'app/templates/partners-promotion';
import type { CustomDAppInfo } from 'lib/apis/temple/endpoints/get-dapps-list';

import { DAPPS_PAGE_NAME } from '../constants';

import { DappItem } from './DappItem';

interface DappsListProps {
  matchingDApps: CustomDAppInfo[];
}

export const DappsList: FC<DappsListProps> = ({ matchingDApps }) => {
  const PartnersPromotionModule = usePartnersPromotionModule();

  const dappsJsx = useMemo(() => {
    const items = matchingDApps.map(dAppProps => <DappItem {...dAppProps} key={dAppProps.slug} />);

    if (!PartnersPromotionModule) return items;

    const { PartnersPromotion, PartnersPromotionVariant } = PartnersPromotionModule;

    const promoJsx = (
      <PartnersPromotion
        id="promo-dapp-item"
        key="promo-dapp-item"
        variant={PartnersPromotionVariant.Text}
        pageName={DAPPS_PAGE_NAME}
      />
    );

    if (matchingDApps.length < 5) {
      items.push(promoJsx);
    } else {
      items.splice(1, 0, promoJsx);
    }

    return items;
  }, [matchingDApps, PartnersPromotionModule]);

  return matchingDApps.length ? <div className="flex flex-col gap-y-3">{dappsJsx}</div> : <EmptyState stretch />;
};
