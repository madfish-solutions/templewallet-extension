import React, { memo } from 'react';

import { HomeSelectors } from 'app/pages/Home/selectors';
import { T } from 'lib/i18n';

import { BannerBase } from '../banner-base';

import rocketAnimation from './rocket-animation.json';

interface UpdateAppBannerBaseProps {
  onClick?: EmptyFn;
}

export const UpdateAppBanner = memo<UpdateAppBannerBaseProps>(({ onClick }) => (
  <BannerBase
    animationData={rocketAnimation}
    title={<T id="newVersion" />}
    description={<T id="clickToUpdateWallet" />}
    onClick={onClick}
    testID={HomeSelectors.updateAppBanner}
  />
));
