import React, { FC } from 'react';

import { isDefined } from '@rnw-community/shared';
import classNames from 'clsx';
import { useDispatch } from 'react-redux';

import { Button } from 'app/atoms/Button';
import { useAppEnv } from 'app/env';
import ContentContainer from 'app/layouts/ContentContainer';
import { useAnalytics } from 'lib/analytics';
import { T } from 'lib/i18n/react';
import { AnalyticsEventCategory } from 'lib/temple/analytics-types';
import { useTempleClient } from 'lib/temple/front';

import { skipAdvertisingPromotionAction } from '../../../store/advertising/advertising-actions';
import {
  useActivePromotionSelector,
  useIsNewPromotionAvailableSelector
} from '../../../store/advertising/advertising-selectors';

export const AdvertisingOverlay: FC = () => {
  const { popup } = useAppEnv();
  const { ready } = useTempleClient();
  const dispatch = useDispatch();
  const analytics = useAnalytics();
  const activePromotion = useActivePromotionSelector();
  const isNewPromotionAvailable = useIsNewPromotionAvailableSelector();

  const popupClassName = popup ? 'inset-0' : 'top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2';
  const analyticsEventPrefix = `${activePromotion?.name}_${popup ? 'POPUP' : 'FULLPAGE'}`;

  const handleSkipPress = () => {
    analytics.trackEvent(`${analyticsEventPrefix}_SKIP`, AnalyticsEventCategory.ButtonPress);
    dispatch(skipAdvertisingPromotionAction());
  };
  const handleBannerPress = () => {
    analytics.trackEvent(`${analyticsEventPrefix}_BANNER`, AnalyticsEventCategory.ButtonPress);
    dispatch(skipAdvertisingPromotionAction());
  };

  return ready && isNewPromotionAvailable && isDefined(activePromotion) ? (
    <>
      <button
        className={'fixed left-0 right-0 top-0 bottom-0 opacity-20 bg-gray-700 z-50'}
        onClick={handleSkipPress}
      ></button>
      <ContentContainer
        className={classNames('fixed z-50', 'max-h-full', 'overflow-y-auto', popupClassName)}
        padding={false}
      >
        <a
          className={classNames('flex items-center justify-center m-auto')}
          style={{
            width: popup ? 360 : 600,
            height: popup ? 600 : 700,
            borderRadius: popup ? 0 : 4,
            backgroundColor: '#E5F2FF'
          }}
          target="_blank"
          rel="noopener noreferrer"
          href={activePromotion.url}
          onClick={handleBannerPress}
        >
          <img
            alt={activePromotion.name}
            src={popup ? activePromotion.popupBannerUrl : activePromotion.fullPageBannerUrl}
          />
        </a>

        <Button
          className={classNames(
            'absolute top-0 right-3 p-3 hover:opacity-50',
            'font-inter font-normal text-sm text-white self-end mt-3',
            popup ? 'mr-1' : 'mr-6'
          )}
          onClick={handleSkipPress}
        >
          <T id="skip" />
        </Button>
      </ContentContainer>
    </>
  ) : null;
};
