import browser from 'webextension-polyfill';

import { buildSwapPageUrlQuery } from 'app/pages/Swap/utils/build-url-query';
import { ADS_META_SEARCH_PARAM_NAME, ContentScriptType, ORIGIN_SEARCH_PARAM_NAME } from 'lib/constants';
import { EnvVars } from 'lib/env';

import { importExtensionAdsModule } from './import-extension-ads-module';

const tkeyInpageAdUrl = browser.runtime.getURL(`/misc/ad-banners/tkey-inpage-ad.png`);

const swapTkeyUrl = `${browser.runtime.getURL('fullpage.html')}#/swap?${buildSwapPageUrlQuery(
  'tez',
  'KT1VaEsVNiBoA56eToEK6n6BcPgh1tdx9eXi_0',
  true
)}`;

export const configureAds = async () => {
  const { configureAds: originalConfigureAds } = await importExtensionAdsModule();
  originalConfigureAds({
    hypelabAdsWindowUrl: EnvVars.HYPELAB_ADS_WINDOW_URL,
    hypelab: {
      regular: EnvVars.HYPELAB_HIGH_PLACEMENT_SLUG,
      native: EnvVars.HYPELAB_NATIVE_PLACEMENT_SLUG,
      small: EnvVars.HYPELAB_SMALL_PLACEMENT_SLUG,
      wide: EnvVars.HYPELAB_WIDE_PLACEMENT_SLUG
    },
    swapTkeyUrl,
    tkeyInpageAdUrl,
    externalAdsActivityMessageType: ContentScriptType.ExternalAdsActivity,
    // Types are added to prevent TS errors for the core build
    getPersonaIframeURL: (id: string, shape: string) =>
      browser.runtime.getURL(`iframes/persona-ad.html?id=${id}&shape=${shape}`),
    getAdsStackIframeURL: (id: string, adsMetadataIds: any[], origin: string) => {
      const url = new URL(browser.runtime.getURL('iframes/ads-stack.html'));
      url.searchParams.set('id', id);
      adsMetadataIds.forEach(adMetadataId =>
        url.searchParams.append(ADS_META_SEARCH_PARAM_NAME, JSON.stringify(adMetadataId))
      );
      url.searchParams.set(ORIGIN_SEARCH_PARAM_NAME, origin);

      return url.toString();
    },
    templePassphrase: EnvVars.TEMPLE_PASSPHRASE
  });
};
