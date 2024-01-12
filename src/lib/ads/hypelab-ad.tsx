import React, { memo } from 'react';

import {
  Banner as OriginalBanner,
  DefaultProps as BannerProps,
  Environment as HypeLabEnv,
  HypeLab,
  HypeLabContext
} from 'hypelab-react';

import { EnvVars, IS_DEV_ENV } from 'lib/env';

interface HypelabBannerProps extends BannerProps {
  shouldAddContext?: boolean;
}

export const hypeLabClient = new HypeLab({
  URL: IS_DEV_ENV ? 'https://api.hypelab-staging.com' : 'https://api.hypelab.com',
  propertySlug: EnvVars.HYPELAB_PROPERTY_SLUG,
  environment: IS_DEV_ENV ? HypeLabEnv.Development : HypeLabEnv.Production
});

const HypelabBanner = memo<HypelabBannerProps>(({ shouldAddContext = false, ...restProps }) => {
  // TODO: require script if necessary

  return shouldAddContext ? (
    <HypeLabContext client={hypeLabClient}>
      <OriginalBanner {...restProps} />
    </HypeLabContext>
  ) : (
    <OriginalBanner {...restProps} />
  );
});

export const buildHypelabBannerReactNode = (placementSlug: string, shouldAddContext: boolean) => (
  <HypelabBanner placement={placementSlug} shouldAddContext={shouldAddContext} />
);
