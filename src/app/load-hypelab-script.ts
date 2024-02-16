import { FC, useEffect } from 'react';

import browser from 'webextension-polyfill';

import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { EnvVars, IS_DEV_ENV } from 'lib/env';

export const LoadHypelabScript: FC = () => {
  const isAdsEnabled = useShouldShowPartnersPromoSelector();

  useEffect(() => {
    if (!isAdsEnabled || document.querySelector('[hypelab-script]')) {
      return;
    }

    try {
      const script = document.createElement('script');
      script.setAttribute('hypelab-script', '');
      script.src = browser.runtime.getURL('/scripts/hypelab.embed.js');
      script.async = true;
      script.onload = () => {
        // @ts-ignore
        HypeLab.initialize({
          URL: IS_DEV_ENV ? 'https://api.hypelab-staging.com' : 'https://api.hypelab.com',
          propertySlug: EnvVars.HYPELAB_PROPERTY_SLUG,
          environment: IS_DEV_ENV ? 'development' : 'production'
        });
      };
      document.head.appendChild(script);
    } catch (err) {
      console.error(err);
    }
  }, [isAdsEnabled]);

  return null;
};
