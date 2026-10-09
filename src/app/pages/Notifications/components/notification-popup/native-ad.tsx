import { FC, Suspense } from 'react';

import { usePartnersPromotionModule } from 'app/templates/partners-promotion';
import { setTestID } from 'lib/analytics';
import { ACCOUNT_NOTIFICATION_POPUP_AD_PAGE_NAME } from 'lib/notifications';

import { NotificationPopupSelectors } from './selectors';

export const NotificationPopupAd: FC = () => (
  <Suspense fallback={null}>
    <NotificationPopupHypelabAd />
  </Suspense>
);

const NotificationPopupHypelabAd: FC = () => {
  const PartnersPromotionModule = usePartnersPromotionModule();

  if (!PartnersPromotionModule) {
    return null;
  }

  return (
    <div className="shrink-0" {...setTestID(NotificationPopupSelectors.ad)}>
      <PartnersPromotionModule.PartnersPromotion
        id="promo-notification-popup"
        variant={PartnersPromotionModule.PartnersPromotionVariant.Text}
        pageName={ACCOUNT_NOTIFICATION_POPUP_AD_PAGE_NAME}
        className="[&>div.inset-0]:bg-background [&>button]:hidden"
      />
    </div>
  );
};
