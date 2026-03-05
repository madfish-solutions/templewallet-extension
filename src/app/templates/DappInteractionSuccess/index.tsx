import React, { memo } from 'react';

import { DoneAnimation } from 'app/atoms/done-animation';
import { DAPPS_PAGE_NAME } from 'app/pages/Dapps/constants';
import { usePartnersPromotionModule } from 'app/templates/partners-promotion';

type Interaction = 'connect' | 'sign' | 'other';

interface Props {
  type: Interaction;
}

const successMessageByType: Record<Interaction, string> = {
  connect: 'Connected',
  sign: 'Signed',
  other: 'Confirmed'
};

export const DappInteractionSuccess = memo<Props>(({ type }) => {
  const PartnersPromotionModule = usePartnersPromotionModule();

  return (
    <div className="h-full flex flex-col bg-background p-4">
      <div className="flex-1 flex flex-col items-center justify-center">
        <DoneAnimation className="w-full max-w-74" />

        <span className="mt-4 text-font-regular-bold">{successMessageByType[type]}</span>
      </div>

      {PartnersPromotionModule && (
        <PartnersPromotionModule.PartnersPromotion
          id="promo-dapp-interaction-success"
          variant={PartnersPromotionModule.PartnersPromotionVariant.Text}
          pageName={DAPPS_PAGE_NAME}
        />
      )}
    </div>
  );
});
