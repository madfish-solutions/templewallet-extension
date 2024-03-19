import { FC, useEffect } from 'react';

import browser from 'webextension-polyfill';

import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { EnvVars, IS_STAGE_ENV } from 'lib/env';

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
        // @ts-expect-error
        HypeLab.initialize({
          URL: EnvVars.HYPELAB_API_URL,
          propertySlug: EnvVars.HYPELAB_PROPERTY_SLUG,
          environment: IS_STAGE_ENV ? 'development' : 'production'
        });
      };
      document.head.appendChild(script);
    } catch (err) {
      console.error(err);
    }
  }, [isAdsEnabled]);

  return null;
};
