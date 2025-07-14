import React, { FC } from 'react';

import { isDefined } from '@rnw-community/shared';
import classNames from 'clsx';
import { useDispatch } from 'react-redux';

import { Anchor, Button } from 'app/atoms';
import { useAppEnv } from 'app/env';
import { LAYOUT_CONTAINER_CLASSNAME } from 'app/layouts/containers';
import { skipAdvertisingPromotionAction } from 'app/store/advertising/actions';
import { useActivePromotionSelector, useIsNewPromotionAvailableSelector } from 'app/store/advertising/selectors';
import { T } from 'lib/i18n/react';
import { useTempleClient } from 'lib/temple/front';

export const AdvertisingOverlay: FC = () => {
  const { fullPage } = useAppEnv();
  const { ready } = useTempleClient();
  const dispatch = useDispatch();
  const activePromotion = useActivePromotionSelector();
  const isNewPromotionAvailable = useIsNewPromotionAvailableSelector();

  const popupClassName = fullPage ? 'top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2' : 'inset-0';
  const analyticsEventPrefix = `${activePromotion?.name}_${fullPage ? 'FULLPAGE' : 'POPUP'}`;

  const handleSkipPress = () => {
    dispatch(skipAdvertisingPromotionAction());
  };
  const handleBannerPress = () => {
    dispatch(skipAdvertisingPromotionAction());
  };

  return ready && isNewPromotionAvailable && isDefined(activePromotion) ? (
    <>
      <Button
        className="fixed inset-0 opacity-20 bg-gray-700 z-overlay-promo"
        onClick={handleSkipPress}
        testID={`${analyticsEventPrefix}_SKIP`}
      />

      <div
        className={classNames(
          LAYOUT_CONTAINER_CLASSNAME,
          'fixed z-overlay-promo max-h-full overflow-y-auto',
          popupClassName
        )}
      >
        <Anchor
          className="flex items-center justify-center m-auto"
          style={{
            width: fullPage ? 600 : 360,
            height: fullPage ? 700 : 600,
            borderRadius: fullPage ? 4 : 0,
            backgroundColor: '#E5F2FF'
          }}
          href={activePromotion.url}
          onClick={handleBannerPress}
          testID={`${analyticsEventPrefix}_BANNER`}
          treatAsButton={true}
        >
          <img
            alt={activePromotion.name}
            src={fullPage ? activePromotion.fullPageBannerUrl : activePromotion.popupBannerUrl}
          />
        </Anchor>

        <Button
          className={classNames(
            'absolute top-0 right-3 px-3 py-2 hover:opacity-50',
            'font-inter font-medium text-sm text-white self-end mt-3',
            'rounded bg-blue-500',
            fullPage ? 'mr-6' : 'mr-1'
          )}
          onClick={handleSkipPress}
          testID={`${analyticsEventPrefix}_SKIP`}
        >
          <T id="skipAd" />
        </Button>
      </div>
    </>
  ) : null;
};
