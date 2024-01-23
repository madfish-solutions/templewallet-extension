import { FC, useEffect } from 'react';

import browser from 'webextension-polyfill';

import { EnvVars, IS_DEV_ENV } from 'lib/env';

export const LoadHypelabScript: FC = () => {
  useEffect(() => {
    if (document.querySelector('[hypelab-script]')) {
      return;
    }

    try {
      const script = document.createElement('script');
      script.setAttribute('hypelab-script', '');
      script.src = browser.runtime.getURL('/hypelab.embed.js');
      script.async = true;
      script.onload = () => {
        console.log('onload');
        // @ts-ignore
        HypeLab.initialize({
          URL: 'https://api.hypelab-staging.com',
          propertySlug: EnvVars.HYPELAB_PROPERTY_SLUG,
          environment: IS_DEV_ENV ? 'development' : 'production'
        });
      };
      document.head.appendChild(script);
    } catch (err) {
      console.error(err);
    }
  }, []);

  return null;
};
