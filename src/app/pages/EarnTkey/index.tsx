import React, { memo, useCallback } from 'react';

import { ReactComponent as AdjustmentIcon } from 'app/icons/base/adjustment.svg';
import { ReactComponent as AdsIcon } from 'app/icons/base/ads_fill.svg';
import { ReactComponent as ChartIcon } from 'app/icons/base/chart_fill.svg';
import { ReactComponent as ScheduleIcon } from 'app/icons/base/schedule.svg';
import { EarnPromoAdvantageItem, EarnPromoLayout } from 'app/layouts/EarnPromoLayout';
import { dispatch } from 'app/store';
import { togglePartnersPromotionAction } from 'app/store/partners-promotion/actions';
import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { toastSuccess } from 'app/toaster';
import { T, t } from 'lib/i18n';
import { Lottie } from 'lib/ui/react-lottie';

import { EarnTkeySelectors } from './selectors';
import tkeyCoinAnimation from './tkey-coin-animation.json';

const tkeyCoinAnimationOptions = {
  loop: true,
  autoplay: true,
  animationData: tkeyCoinAnimation,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice'
  }
};

const advantages: EarnPromoAdvantageItem[] = [
  { Icon: AdsIcon, textI18nKey: 'nonIntrusiveAds' },
  { Icon: ChartIcon, textI18nKey: 'earnOnBackground' },
  { Icon: ScheduleIcon, textI18nKey: 'autoPayouts' },
  { Icon: AdjustmentIcon, textI18nKey: 'turnOnWhenNeeded' }
];

export const EarnTkeyPage = memo(() => {
  const isEnabled = useShouldShowPartnersPromoSelector();

  const handleStartEarningClick = useCallback(() => {
    dispatch(togglePartnersPromotionAction(true));
    toastSuccess(t('rewardsEarningEnabled'));
  }, []);

  return (
    <EarnPromoLayout
      pageTitle={t('earn')}
      TopVisual={<Lottie isClickToPauseDisabled options={tkeyCoinAnimationOptions} height={172} width={352} />}
      headline={<T id="earnTkeyHeadline" />}
      advantages={advantages}
      advantageIconClassName="text-primary"
      disclaimer={<T id="earnTkeyDisclaimer" />}
      actionText={<T id={isEnabled ? 'enabled' : 'startEarning'} />}
      actionColor="primary"
      actionDisabled={isEnabled}
      onActionClick={handleStartEarningClick}
      actionTestID={EarnTkeySelectors.startEarningButton}
    />
  );
});
