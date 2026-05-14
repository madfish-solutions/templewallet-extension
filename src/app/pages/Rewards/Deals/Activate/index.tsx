import { FC } from 'react';

import { PageTitle } from 'app/atoms';
import { ReactComponent as BrandsIcon } from 'app/icons/base/brands.svg';
import { ReactComponent as CalendarIcon } from 'app/icons/base/calendar.svg';
import { ReactComponent as CardSecureIcon } from 'app/icons/base/card-secure.svg';
import { ReactComponent as CartIcon } from 'app/icons/base/cart.svg';
import { EarnPromoLayout, EarnPromoAdvantageItem } from 'app/layouts/EarnPromoLayout';
import { dispatch } from 'app/store';
import { setDealsEnabledAction } from 'app/store/deals/actions';
import { useDealsEnabledSelector } from 'app/store/deals/selectors';
import { toastSuccess } from 'app/toaster';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { t } from 'lib/i18n';
import { HistoryAction, navigate } from 'lib/woozie';

import merchantsStackImage from '../../DealsCard/assets/merchant-stack.png';

import { RewardsDealsActivateSelectors } from './selectors';

const advantages: EarnPromoAdvantageItem[] = [
  { Icon: CartIcon, textI18nKey: 'activateInOneClickFeature' },
  { Icon: BrandsIcon, textI18nKey: 'accessPartnerOffersFeature' },
  { Icon: CalendarIcon, textI18nKey: 'autoPayoutMonthlyFeature' },
  { Icon: CardSecureIcon, textI18nKey: 'paymentDetailsPrivateFeature' }
];

export const RewardsDealsActivate: FC = () => {
  const isEnabled = useDealsEnabledSelector();
  const { trackEvent } = useAnalytics();

  const handleActivate = () => {
    if (!isEnabled) {
      dispatch(setDealsEnabledAction(true));
      trackEvent(RewardsDealsActivateSelectors.activateCashbackButton, AnalyticsEventCategory.ButtonPress);
    }
    toastSuccess(t('cashbackRewardsActivated'));
    navigate('/rewards', HistoryAction.Replace);
  };

  return (
    <EarnPromoLayout
      pageTitle={<PageTitle title={t('templeDeals')} />}
      TopVisual={<img src={merchantsStackImage} alt="merchants" className="w-55 h-30 object-contain" />}
      headline={t('upTo25CashbackInUSDT')}
      advantages={advantages}
      advantageIconClassName="text-primary"
      disclaimer={t('enableCashbackDisclaimer')}
      actionText={t('activateCashback')}
      actionColor="primary"
      onActionClick={handleActivate}
      actionTestID={RewardsDealsActivateSelectors.activateCashbackButton}
    />
  );
};
