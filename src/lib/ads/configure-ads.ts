import { AdMetadata } from '@temple-wallet/extension-ads';
import browser from 'webextension-polyfill';

import { buildSwapPageUrlQuery } from 'app/pages/Swap/utils/build-url-query';
import { ADS_META_SEARCH_PARAM_NAME, ContentScriptType, ORIGIN_SEARCH_PARAM_NAME } from 'lib/constants';
import { APP_VERSION, EnvVars } from 'lib/env';

import { importExtensionAdsModule } from './import-extension-ads-module';

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

const buildNativeAdsMeta = (containerWidth: number, containerHeight: number) => [
  {
    source: {
      providerName: 'HypeLab' as const,
      native: true as const,
      slug: EnvVars.HYPELAB_NATIVE_PLACEMENT_SLUG
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
];

const bannerAdsMeta: AdMetadata[] = [
  {
    source: {
      providerName: 'SmartyAds',
      native: false,
      slug: EnvVars.SMARTY_970_250_PLACEMENT_ID,
      categories: ['other']
    },
    dimensions: {
      width: 970,
      height: 250,
      minContainerWidth: 969,
      minContainerHeight: 249,
      maxContainerWidth: Infinity,
      maxContainerHeight: 500
    }
  },
  {
    source: {
      providerName: 'SmartyAds',
      native: false,
      slug: EnvVars.SMARTY_970_90_PLACEMENT_ID,
      categories: ['other']
    },
    dimensions: {
      width: 970,
      height: 90,
      minContainerWidth: 969,
      minContainerHeight: 89,
      maxContainerWidth: Infinity,
      maxContainerHeight: 300
    }
  },
  {
    source: {
      providerName: 'SmartyAds',
      native: false,
      slug: EnvVars.SMARTY_728_90_PLACEMENT_ID,
      categories: ['other']
    },
    dimensions: {
      width: 728,
      height: 90,
      minContainerWidth: 727,
      minContainerHeight: 89,
      maxContainerWidth: Infinity,
      maxContainerHeight: 300
    }
  },
  {
    source: {
      providerName: 'SmartyAds',
      native: false,
      slug: EnvVars.SMARTY_300_600_PLACEMENT_ID,
      categories: ['other']
    },
    dimensions: {
      width: 300,
      height: 600,
      minContainerWidth: 299,
      minContainerHeight: 599,
      maxContainerWidth: 600,
      maxContainerHeight: Infinity
    }
  },
  {
    source: {
      providerName: 'SmartyAds',
      native: false,
      slug: EnvVars.SMARTY_160_600_PLACEMENT_ID,
      categories: ['other']
    },
    dimensions: {
      width: 160,
      height: 600,
      minContainerWidth: 159,
      minContainerHeight: 599,
      maxContainerWidth: 360,
      maxContainerHeight: Infinity
    }
  },
  {
    source: {
      providerName: 'SmartyAds',
      native: false,
      slug: EnvVars.SMARTY_336_280_PLACEMENT_ID,
      categories: ['other']
    },
    dimensions: {
      width: 336,
      height: 280,
      minContainerWidth: 335,
      minContainerHeight: 279,
      maxContainerWidth: 728,
      maxContainerHeight: 480
    }
  },
  {
    source: {
      providerName: 'SmartyAds',
      native: false,
      slug: EnvVars.SMARTY_300_250_PLACEMENT_ID,
      categories: ['other']
    },
    dimensions: {
      width: 300,
      height: 250,
      minContainerWidth: 299,
      minContainerHeight: 249,
      maxContainerWidth: 700,
      maxContainerHeight: 500
    }
  },
  {
    source: {
      providerName: 'SmartyAds',
      native: false,
      slug: EnvVars.SMARTY_320_100_PLACEMENT_ID,
      categories: ['other']
    },
    dimensions: {
      width: 320,
      height: 100,
      minContainerWidth: 319,
      minContainerHeight: 99,
      maxContainerWidth: 420,
      maxContainerHeight: 200
    }
  },
  {
    source: {
      providerName: 'SmartyAds',
      native: false,
      slug: EnvVars.SMARTY_320_50_PLACEMENT_ID,
      categories: ['other'],
      shouldNotUseStrictContainerLimits: true
    },
    dimensions: {
      width: 320,
      height: 50,
      minContainerWidth: 319,
      minContainerHeight: 49,
      maxContainerWidth: 420,
      maxContainerHeight: 130
    }
  },
  {
    source: {
      providerName: 'HypeLab',
      native: false,
      slug: EnvVars.HYPELAB_WIDE_PLACEMENT_SLUG
    },
    dimensions: {
      width: 728,
      height: 90,
      minContainerWidth: 727,
      minContainerHeight: 89,
      maxContainerWidth: Infinity,
      maxContainerHeight: 300
    }
  },
  {
    source: {
      providerName: 'Temple',
      slug: ''
    },
    dimensions: {
      width: 728,
      height: 90,
      minContainerWidth: 727,
      minContainerHeight: 89,
      maxContainerWidth: Infinity,
      maxContainerHeight: 300
    }
  },
  {
    source: {
      providerName: 'Persona',
      slug: EnvVars.PERSONA_ADS_MEDIUM_BANNER_UNIT_ID
    },
    dimensions: {
      width: 600,
      height: 160,
      minContainerWidth: 599,
      minContainerHeight: 159,
      maxContainerWidth: 800,
      maxContainerHeight: 300
    }
  },
  {
    source: {
      providerName: 'HypeLab',
      native: false,
      slug: EnvVars.HYPELAB_HIGH_PLACEMENT_SLUG
    },
    dimensions: {
      width: 300,
      height: 250,
      minContainerWidth: 299,
      minContainerHeight: 249,
      maxContainerWidth: 700,
      maxContainerHeight: 500
    }
  },
  {
    source: {
      providerName: 'Persona',
      slug: EnvVars.PERSONA_ADS_SQUARISH_BANNER_UNIT_ID
    },
    dimensions: {
      width: 300,
      height: 250,
      minContainerWidth: 299,
      minContainerHeight: 249,
      maxContainerWidth: 700,
      maxContainerHeight: 500
    }
  },
  {
    source: {
      providerName: 'HypeLab',
      native: false,
      slug: EnvVars.HYPELAB_SMALL_PLACEMENT_SLUG,
      shouldNotUseStrictContainerLimits: true
    },
    dimensions: {
      width: 320,
      height: 50,
      minContainerWidth: 319,
      minContainerHeight: 49,
      maxContainerWidth: 420,
      maxContainerHeight: 130
    }
  },
  {
    source: {
      providerName: 'Persona',
      slug: EnvVars.PERSONA_ADS_BANNER_UNIT_ID,
      shouldNotUseStrictContainerLimits: true
    },
    dimensions: {
      width: 321,
      height: 101,
      minContainerWidth: 319,
      minContainerHeight: 99,
      maxContainerWidth: 420,
      maxContainerHeight: 130
    }
  }
];

export const configureAds = async () => {
  const { configureAds: originalConfigureAds } = await importExtensionAdsModule();
  originalConfigureAds({
    adsTwWindowUrl: EnvVars.HYPELAB_ADS_WINDOW_URL,
    swapTkeyUrl,
    tkeyInpageAdUrl,
    externalAdsActivityMessageType: ContentScriptType.ExternalAdsActivity,
    personaIframePath: browser.runtime.getURL('iframes/persona-ad.html'),
    getAdsStackIframeURL,
    buildNativeAdsMeta,
    bannerAdsMeta,
    extVersion: APP_VERSION,
    templePassphrase: EnvVars.TEMPLE_ADS_ORIGIN_PASSPHRASE,
    isMisesBrowser: false
  });
};
