import browser from 'webextension-polyfill';

import { buildSwapPageUrlQuery } from 'app/pages/Swap/utils/build-url-query';
import { ADS_META_SEARCH_PARAM_NAME, ContentScriptType, ORIGIN_SEARCH_PARAM_NAME } from 'lib/constants';
import { APP_VERSION, EnvVars, IS_MISES_BROWSER } from 'lib/env';

import { importExtensionAdsModule } from './import-extension-ads-module';

const smallTkeyInpageAdUrl = browser.runtime.getURL(`/misc/ad-banners/small-tkey-inpage-ad.png`);
const tkeyInpageAdUrl = browser.runtime.getURL(`/misc/ad-banners/tkey-inpage-ad.png`);

const swapTkeyUrl = `${browser.runtime.getURL('fullpage.html')}#/swap?${buildSwapPageUrlQuery(
  'tez',
  'KT1VaEsVNiBoA56eToEK6n6BcPgh1tdx9eXi_0',
  true
)}`;

const getAdsStackIframeURL = (id: string, adsMetadataIds: any[], origin: string) => {
  const url = new URL(browser.runtime.getURL('iframes/ads-stack.html'));
  url.searchParams.set('id', id);
  adsMetadataIds.forEach(adMetadataId =>
    url.searchParams.append(ADS_META_SEARCH_PARAM_NAME, JSON.stringify(adMetadataId))
  );
  url.searchParams.set(ORIGIN_SEARCH_PARAM_NAME, origin);

  return url.toString();
};

const buildNativeAdsMeta = (containerWidth: number, containerHeight: number) =>
  [
    {
      source: {
        providerName: 'HypeLab' as const,
        native: true as const,
        slug: IS_MISES_BROWSER ? EnvVars.HYPELAB_MISES_NATIVE_PLACEMENT_SLUG : EnvVars.HYPELAB_NATIVE_PLACEMENT_SLUG
      },
      dimensions: {
        width: Math.max(160, containerWidth),
        height: Math.max(16, containerHeight),
        minContainerWidth: 2,
        minContainerHeight: 2,
        maxContainerWidth: Infinity,
        maxContainerHeight: Infinity
      }
    },
    EnvVars.USE_ADS_STUBS && {
      source: {
        providerName: 'Temple' as const,
        native: true as const
      },
      dimensions: {
        width: Math.max(160, containerWidth),
        height: Math.max(16, containerHeight),
        minContainerWidth: 2,
        minContainerHeight: 2,
        maxContainerWidth: Infinity,
        maxContainerHeight: Infinity
      }
    }
  ].filter((value): value is Exclude<typeof value, false> => Boolean(value));

const bannerAdsMeta = [
  {
    source: {
      providerName: 'HypeLab' as const,
      native: false,
      slug: IS_MISES_BROWSER ? EnvVars.HYPELAB_MISES_WIDE_PLACEMENT_SLUG : EnvVars.HYPELAB_WIDE_PLACEMENT_SLUG
    },
    dimensions: {
      width: 728,
      height: 90,
      minContainerWidth: 728,
      minContainerHeight: 90,
      maxContainerWidth: Infinity,
      maxContainerHeight: 300
    }
  },
  {
    source: {
      providerName: 'Temple' as const
    },
    dimensions: {
      width: 728,
      height: 90,
      minContainerWidth: 728,
      minContainerHeight: 90,
      maxContainerWidth: Infinity,
      maxContainerHeight: 300
    }
  },
  {
    source: {
      providerName: 'Persona' as const,
      slug: IS_MISES_BROWSER
        ? EnvVars.PERSONA_ADS_MISES_MEDIUM_BANNER_UNIT_ID
        : EnvVars.PERSONA_ADS_MEDIUM_BANNER_UNIT_ID
    },
    dimensions: {
      width: 600,
      height: 160,
      minContainerWidth: 600,
      minContainerHeight: 160,
      maxContainerWidth: 800,
      maxContainerHeight: 300
    }
  },
  {
    source: {
      providerName: 'HypeLab' as const,
      native: false,
      slug: IS_MISES_BROWSER ? EnvVars.HYPELAB_MISES_HIGH_PLACEMENT_SLUG : EnvVars.HYPELAB_HIGH_PLACEMENT_SLUG
    },
    dimensions: {
      width: 300,
      height: 250,
      minContainerWidth: 300,
      minContainerHeight: 250,
      maxContainerWidth: 700,
      maxContainerHeight: Infinity
    }
  },
  {
    source: {
      providerName: 'Persona' as const,
      slug: IS_MISES_BROWSER
        ? EnvVars.PERSONA_ADS_MISES_SQUARISH_BANNER_UNIT_ID
        : EnvVars.PERSONA_ADS_SQUARISH_BANNER_UNIT_ID
    },
    dimensions: {
      width: 300,
      height: 250,
      minContainerWidth: 300,
      minContainerHeight: 250,
      maxContainerWidth: 700,
      maxContainerHeight: Infinity
    }
  },
  {
    source: {
      providerName: 'HypeLab' as const,
      native: false,
      slug: IS_MISES_BROWSER ? EnvVars.HYPELAB_MISES_SMALL_PLACEMENT_SLUG : EnvVars.HYPELAB_SMALL_PLACEMENT_SLUG,
      shouldNotUseStrictContainerLimits: true
    },
    dimensions: {
      width: 320,
      height: 50,
      minContainerWidth: 320,
      minContainerHeight: 50,
      maxContainerWidth: 420,
      maxContainerHeight: 130
    }
  },
  {
    source: {
      providerName: 'Persona' as const,
      slug: IS_MISES_BROWSER ? EnvVars.PERSONA_ADS_MISES_BANNER_UNIT_ID : EnvVars.PERSONA_ADS_BANNER_UNIT_ID
    },
    dimensions: {
      width: 321,
      height: 101,
      minContainerWidth: 321,
      minContainerHeight: 101,
      maxContainerWidth: 420,
      maxContainerHeight: 130
    }
  },
  EnvVars.USE_ADS_STUBS && {
    source: {
      providerName: 'Temple' as const,
      shouldNotUseStrictContainerLimits: true
    },
    dimensions: {
      width: 320,
      height: 50,
      minContainerWidth: 320,
      minContainerHeight: 50,
      maxContainerWidth: 420,
      maxContainerHeight: 130
    }
  }
].filter((value): value is Exclude<typeof value, false> => Boolean(value));

export const configureAds = async () => {
  const { configureAds: originalConfigureAds } = await importExtensionAdsModule();
  originalConfigureAds({
    hypelabAdsWindowUrl: EnvVars.HYPELAB_ADS_WINDOW_URL,
    swapTkeyUrl,
    tkeyInpageAdUrl,
    smallTkeyInpageAdUrl,
    externalAdsActivityMessageType: ContentScriptType.ExternalAdsActivity,
    // Types are added to prevent TS errors for the core build
    getPersonaIframeURL: (id: string, slug: string) =>
      browser.runtime.getURL(`iframes/persona-ad.html?id=${id}&slug=${slug}`),
    getAdsStackIframeURL,
    buildNativeAdsMeta,
    bannerAdsMeta,
    extVersion: APP_VERSION,
    templePassphrase: EnvVars.TEMPLE_ADS_ORIGIN_PASSPHRASE,
    isMisesBrowser: IS_MISES_BROWSER
  });
};
