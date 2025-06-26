import React, { FC, useMemo } from 'react';

import { SuspenseContainer } from 'app/atoms/SuspenseContainer';
import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/templates/partners-promotion';
import { t } from 'lib/i18n/react';

interface Props extends PropsWithChildren {
  chainId?: string | number;
  assetSlug?: string;
}

export const ActivityListContainer: FC<Props> = ({ children, chainId, assetSlug }) => {
  const shouldShowPartnersPromo = useShouldShowPartnersPromoSelector();

  const promotion = useMemo(() => {
    if (shouldShowPartnersPromo)
      return (
        <PartnersPromotion
          id={['promo-activity', chainId ?? 'multi', assetSlug ?? 'all'].join('-')}
          variant={PartnersPromotionVariant.Image}
          pageName="Activity"
          className="mb-4"
        />
      );

    // TODO: Update banner UI
    // return assetSlug === TEMPLE_TOKEN_SLUG ? <ReactivateAdsBanner /> : null;
    return null;
  }, [shouldShowPartnersPromo, chainId, assetSlug]);

  return (
    <SuspenseContainer errorMessage={t('operationHistoryWhileMessage')}>
      <div className="flex-grow flex flex-col">
        {promotion}

        {children}
      </div>
    </SuspenseContainer>
  );
};
