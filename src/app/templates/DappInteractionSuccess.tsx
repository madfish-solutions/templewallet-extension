import React, { memo } from 'react';

import { DoneAnimation } from 'app/atoms/done-animation';
import PageLayout from 'app/layouts/PageLayout';
import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { usePartnersPromotionModule } from 'app/templates/partners-promotion';
import { T, TID } from 'lib/i18n';
import { NullComponent } from 'lib/ui/null-component';

export type DappInteractionSuccessType = 'connect' | 'sign' | 'other';

const successTIDByType: Record<DappInteractionSuccessType, TID> = {
  connect: 'connected',
  sign: 'signed',
  other: 'confirmed'
};

interface Props {
  type: DappInteractionSuccessType;
}

export const DappInteractionSuccess = memo<Props>(({ type }) => {
  const shouldShowPartnersPromoState = useShouldShowPartnersPromoSelector();
  const PartnersPromotionModule = usePartnersPromotionModule();

  return (
    <PageLayout Header={NullComponent} contentPadding={false} contentClassName="p-4 pb-8">
      <div className="flex-1 flex flex-col items-center justify-center pb-8">
        <DoneAnimation />

        <span className="text-font-regular-bold">
          <T id={successTIDByType[type]} />
        </span>
      </div>

      {shouldShowPartnersPromoState && PartnersPromotionModule && (
        <PartnersPromotionModule.PartnersPromotion
          id="promo-dapp-interaction-success-item"
          variant={PartnersPromotionModule.PartnersPromotionVariant.Text}
          pageName="Dapp Interaction Success"
        />
      )}
    </PageLayout>
  );
});
