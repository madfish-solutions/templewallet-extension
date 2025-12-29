import React, { memo, useCallback } from 'react';

import { CLOSE_ANIMATION_TIMEOUT } from 'app/atoms/PageModal';
import { useRewardsAddresses } from 'app/hooks/use-rewards-addresses';
import { HomeSelectors } from 'app/pages/Home/selectors';
import { dispatch } from 'app/store';
import { togglePartnersPromotionAction } from 'app/store/partners-promotion/actions';
import { toastSuccess } from 'app/toaster';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { SHOULD_HIDE_ENABLE_ADS_BANNER_STORAGE_KEY } from 'lib/constants';
import { T, t } from 'lib/i18n';
import { useStorage } from 'lib/temple/front';
import { useBooleanState } from 'lib/ui/hooks';

import { BannerBase } from '../banner-base';

import rewardsAnimation from './rewards-animation.json';
import { RewardsModal } from './rewards-modal';

export const EnableAdsBanner = memo(() => {
  const { trackEvent } = useAnalytics();
  const { tezosAddress: accountPkh } = useRewardsAddresses();
  const [rewardsModalVisible, openRewardsModal, closeRewardsModal] = useBooleanState(false);
  const [, setShouldHideEnableAdsBanner] = useStorage(SHOULD_HIDE_ENABLE_ADS_BANNER_STORAGE_KEY);

  const handleRewardsModalClose = useCallback(() => {
    setShouldHideEnableAdsBanner(true);
    closeRewardsModal();
  }, [setShouldHideEnableAdsBanner, closeRewardsModal]);

  const handleActionClick = useCallback(() => {
    closeRewardsModal();
    dispatch(togglePartnersPromotionAction(true));
    trackEvent('AdsEnabled', AnalyticsEventCategory.General, { accountPkh }, true);
    setTimeout(() => toastSuccess(t('rewardsEarningSuccessfullyEnabled')), CLOSE_ANIMATION_TIMEOUT * 2);
  }, [accountPkh, closeRewardsModal, trackEvent]);

  return (
    <>
      <BannerBase
        animationData={rewardsAnimation}
        title={<T id="enableAdsBannerTitle" />}
        description={<T id="enableAdsBannerDescription" />}
        onClick={openRewardsModal}
        testID={HomeSelectors.enableAdsBanner}
      />

      <RewardsModal
        isOpen={rewardsModalVisible}
        onRequestClose={handleRewardsModalClose}
        onActionClick={handleActionClick}
      />
    </>
  );
});
