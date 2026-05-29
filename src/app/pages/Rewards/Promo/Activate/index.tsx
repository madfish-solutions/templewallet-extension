import React, { FC } from 'react';

import { PageTitle } from 'app/atoms';
import { ReactComponent as CalendarIcon } from 'app/icons/base/calendar.svg';
import { ReactComponent as ChartIcon } from 'app/icons/base/chart.svg';
import { ReactComponent as CogIcon } from 'app/icons/base/gears.svg';
import { ReactComponent as MegaphoneIcon } from 'app/icons/base/megaphone.svg';
import { EarnPromoLayout, EarnPromoAdvantageItem } from 'app/layouts/EarnPromoLayout';
import tkeyCoinAnimation from 'app/pages/EarnTkey/tkey-coin-animation.json';
import { dispatch } from 'app/store';
import { togglePartnersPromotionAction } from 'app/store/partners-promotion/actions';
import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { toastSuccess } from 'app/toaster';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { t } from 'lib/i18n';
import { Lottie } from 'lib/ui/react-lottie';
import { HistoryAction, navigate } from 'lib/woozie';

import { RewardsPromoActivateSelectors } from './selectors';

const advantages: EarnPromoAdvantageItem[] = [
  { Icon: MegaphoneIcon, textI18nKey: 'nonIntrusiveContentFeature' },
  { Icon: CalendarIcon, textI18nKey: 'autoPayoutsWithoutClaimFeature' },
  { Icon: ChartIcon, textI18nKey: 'earnInBackgroundFeature' },
  { Icon: CogIcon, textI18nKey: 'turnOnWhenWorksFeature' }
];

const tkeyCoinAnimationOptions = {
  loop: true,
  autoplay: true,
  animationData: tkeyCoinAnimation,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice'
  }
};

export const RewardsPromoActivate: FC = () => {
  const isEnabled = useShouldShowPartnersPromoSelector();
  const { trackEvent } = useAnalytics();

  const handleActivate = () => {
    if (!isEnabled) {
      dispatch(togglePartnersPromotionAction(true));
      trackEvent(RewardsPromoActivateSelectors.startEarningButton, AnalyticsEventCategory.ButtonPress);
    }
    toastSuccess(t('promoRewardsActivated'));
    navigate('/rewards', HistoryAction.Replace);
  };

  return (
    <EarnPromoLayout
      pageTitle={<PageTitle title={t('promo')} />}
      TopVisual={<Lottie isClickToPauseDisabled options={tkeyCoinAnimationOptions} height={172} width={352} />}
      headline={t('receiveShareOf20PromoRewards')}
      advantages={advantages}
      advantageIconClassName="text-primary"
      disclaimer={t('enablePromoDisclaimer')}
      actionText={t('startEarning')}
      actionColor="primary"
      onActionClick={handleActivate}
      actionTestID={RewardsPromoActivateSelectors.startEarningButton}
    />
  );
};
