import browser from 'webextension-polyfill';

import { buildSwapPagePath } from 'app/pages/Swap/build-url-query';
import { getDApp } from 'app/storage/dapps';
import {
  ADS_META_SEARCH_PARAM_NAME,
  ADS_VIEWER_DATA_STORAGE_KEY,
  AD_CATEGORIES_PARAM_NAME,
  CHAIN_NAME_SEARCH_PARAM_NAME,
  ContentScriptType,
  EVM_ACCOUNT_SEARCH_PARAM_NAME,
  FONT_SIZE_SEARCH_PARAM_NAME,
  LINE_HEIGHT_SEARCH_PARAM_NAME,
  ORIGIN_SEARCH_PARAM_NAME,
  THEME_COLOR_SEARCH_PARAM_NAME
} from 'lib/constants';
import { APP_VERSION, EnvVars, IS_MISES_BROWSER } from 'lib/env';
import { fetchFromStorage } from 'lib/storage';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { isTruthy } from 'lib/utils';
import { TempleChainKind, type AdsViewerData } from 'temple/types';

// TODO: Fetch them from CDN for ads data
import evmChainsNames from './evm-chains-names.json';
import { importExtensionAdsModule } from './import-extension-ads-module';

// Four interfaces below are copied from '@temple-wallet/extension-ads' to avoid importing it to ensure that a core
// build runs without errors.
interface AdSource {
  shouldNotUseStrictContainerLimits?: boolean;
  providerName: 'Temple' | 'Persona' | 'HypeLab' | 'Bitmedia';
  native?: boolean;
  slug: string;
  categories?: string[];
}

interface AdDimensions {
  width: number;
  height: number;
  minContainerWidth: number;
  minContainerHeight: number;
  maxContainerWidth: number;
  maxContainerHeight: number;
}

interface AdMetadata {
  source: AdSource;
  dimensions: AdDimensions;
}

interface AdsStackIframeURLParams {
  id: string;
  adsMetadataIds: any[];
  origin: string;
  adCategories: string[];
  themeColor?: string;
  fontSize?: number;
  lineHeight?: number;
  evmAccountAddress?: string;
  chainName?: string;
}

const smallTkeyInpageAdUrl = browser.runtime.getURL(`/misc/ad-banners/small-tkey-inpage-ad.png`);
const tkeyInpageAdUrl = browser.runtime.getURL(`/misc/ad-banners/tkey-inpage-ad.png`);

const swapTkeyUrl = `${browser.runtime.getURL('fullpage.html')}#${buildSwapPagePath(
  { chainKind: 'tezos', chainId: TEZOS_MAINNET_CHAIN_ID, assetSlug: 'tez' },
  { chainKind: 'tezos', chainId: TEZOS_MAINNET_CHAIN_ID, assetSlug: 'KT1VaEsVNiBoA56eToEK6n6BcPgh1tdx9eXi_0' },
  true
)}`;

const searchParamsNames = {
  id: 'id',
  themeColor: THEME_COLOR_SEARCH_PARAM_NAME,
  fontSize: FONT_SIZE_SEARCH_PARAM_NAME,
  lineHeight: LINE_HEIGHT_SEARCH_PARAM_NAME,
  evmAccountAddress: EVM_ACCOUNT_SEARCH_PARAM_NAME,
  chainName: CHAIN_NAME_SEARCH_PARAM_NAME
};

const getAdsStackIframeURL = ({
  adsMetadataIds,
  origin,
  adCategories,
  ...plainSearchParamsInput
}: AdsStackIframeURLParams) => {
  const url = new URL(browser.runtime.getURL('iframes/ads-stack.html'));
  for (const searchParamsInputName in plainSearchParamsInput) {
    const searchParamsInputNameTyped = searchParamsInputName as keyof typeof plainSearchParamsInput;
    const key = searchParamsNames[searchParamsInputNameTyped];
    const value = plainSearchParamsInput[searchParamsInputNameTyped];
    if (value || value === 0) {
      url.searchParams.set(key, String(value));
    }
  }
  adsMetadataIds.forEach(adMetadataId =>
    url.searchParams.append(ADS_META_SEARCH_PARAM_NAME, JSON.stringify(adMetadataId))
  );
  url.searchParams.set(ORIGIN_SEARCH_PARAM_NAME, origin);
  adCategories.forEach(category => url.searchParams.append(AD_CATEGORIES_PARAM_NAME, category));

  return url.toString();
};

const buildNativeAdsMeta = (containerWidth: number, containerHeight: number) =>
  [
    {
      source: {
        providerName: 'HypeLab' as const,
        native: true as const,
        slug: EnvVars.HYPELAB_EXTERNAL_NATIVE_PLACEMENT_SLUG
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
        slug: '',
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
  ].filter(isTruthy);

const bannerAdsMetaBase: (AdMetadata | false)[] = [
  isTruthy(EnvVars.BITMEDIA_970_90_PLACEMENT_ID) && {
    source: {
      providerName: 'Bitmedia' as const,
      native: false,
      slug: EnvVars.BITMEDIA_970_90_PLACEMENT_ID
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
      providerName: 'HypeLab' as const,
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
      providerName: 'Bitmedia' as const,
      native: false,
      slug: EnvVars.BITMEDIA_728_90_PLACEMENT_ID
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
  EnvVars.PERSONA_ADS_ENABLED && {
    source: {
      providerName: 'Persona' as const,
      native: false,
      slug: IS_MISES_BROWSER ? EnvVars.PERSONA_ADS_MISES_WIDE_BANNER_UNIT_ID : EnvVars.PERSONA_ADS_WIDE_BANNER_UNIT_ID
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
  EnvVars.PERSONA_ADS_ENABLED && {
    source: {
      providerName: 'Persona' as const,
      native: false,
      slug: IS_MISES_BROWSER
        ? EnvVars.PERSONA_ADS_MISES_MEDIUM_BANNER_UNIT_ID
        : EnvVars.PERSONA_ADS_MEDIUM_BANNER_UNIT_ID
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
  isTruthy(EnvVars.BITMEDIA_300_600_PLACEMENT_ID) && {
    source: {
      providerName: 'Bitmedia' as const,
      native: false,
      slug: EnvVars.BITMEDIA_300_600_PLACEMENT_ID
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
  isTruthy(EnvVars.BITMEDIA_160_600_PLACEMENT_ID) && {
    source: {
      providerName: 'Bitmedia' as const,
      native: false,
      slug: EnvVars.BITMEDIA_160_600_PLACEMENT_ID
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
  isTruthy(EnvVars.BITMEDIA_336_280_PLACEMENT_ID) && {
    source: {
      providerName: 'Bitmedia' as const,
      native: false,
      slug: EnvVars.BITMEDIA_336_280_PLACEMENT_ID
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
      providerName: 'HypeLab' as const,
      native: false,
      slug: EnvVars.HYPELAB_HIGH_PLACEMENT_SLUG
    },
    dimensions: {
      width: 300,
      height: 250,
      minContainerWidth: 299,
      minContainerHeight: 249,
      maxContainerWidth: 700,
      maxContainerHeight: Infinity
    }
  },
  {
    source: {
      providerName: 'Bitmedia' as const,
      native: false,
      slug: EnvVars.BITMEDIA_300_250_PLACEMENT_ID
    },
    dimensions: {
      width: 300,
      height: 250,
      minContainerWidth: 299,
      minContainerHeight: 249,
      maxContainerWidth: 700,
      maxContainerHeight: Infinity
    }
  },
  EnvVars.PERSONA_ADS_ENABLED && {
    source: {
      providerName: 'Persona' as const,
      slug: IS_MISES_BROWSER
        ? EnvVars.PERSONA_ADS_MISES_SQUARISH_BANNER_UNIT_ID
        : EnvVars.PERSONA_ADS_SQUARISH_BANNER_UNIT_ID
    },
    dimensions: {
      width: 300,
      height: 250,
      minContainerWidth: 299,
      minContainerHeight: 249,
      maxContainerWidth: 700,
      maxContainerHeight: Infinity
    }
  },
  isTruthy(EnvVars.BITMEDIA_250_250_PLACEMENT_ID) && {
    source: {
      providerName: 'Bitmedia' as const,
      native: false,
      slug: EnvVars.BITMEDIA_250_250_PLACEMENT_ID
    },
    dimensions: {
      width: 250,
      height: 250,
      minContainerWidth: 249,
      minContainerHeight: 249,
      maxContainerWidth: 650,
      maxContainerHeight: Infinity
    }
  },
  {
    source: {
      providerName: 'HypeLab' as const,
      native: false,
      slug: EnvVars.HYPELAB_EXTERNAL_MEDIUM_PLACEMENT_SLUG
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
  isTruthy(EnvVars.BITMEDIA_320_100_PLACEMENT_ID) && {
    source: {
      providerName: 'Bitmedia' as const,
      native: false,
      slug: EnvVars.BITMEDIA_320_100_PLACEMENT_ID
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
  isTruthy(EnvVars.BITMEDIA_300_100_PLACEMENT_ID) && {
    source: {
      providerName: 'Bitmedia' as const,
      native: false,
      slug: EnvVars.BITMEDIA_300_100_PLACEMENT_ID
    },
    dimensions: {
      width: 300,
      height: 100,
      minContainerWidth: 299,
      minContainerHeight: 99,
      maxContainerWidth: 400,
      maxContainerHeight: 200
    }
  },
  {
    source: {
      providerName: 'HypeLab' as const,
      native: false,
      slug: EnvVars.HYPELAB_EXTERNAL_SMALL_PLACEMENT_SLUG,
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
      providerName: 'Bitmedia' as const,
      native: false,
      slug: EnvVars.BITMEDIA_320_50_PLACEMENT_ID,
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
  EnvVars.PERSONA_ADS_ENABLED && {
    source: {
      providerName: 'Persona' as const,
      slug: IS_MISES_BROWSER ? EnvVars.PERSONA_ADS_MISES_BANNER_UNIT_ID : EnvVars.PERSONA_ADS_BANNER_UNIT_ID,
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
  },
  EnvVars.USE_ADS_STUBS && {
    source: {
      providerName: 'Temple' as const,
      slug: '',
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
  }
];

const bannerAdsMeta = bannerAdsMetaBase.filter(isTruthy);

const pickNextAdMetadata = (
  allAdsMetadata: AdMetadata[],
  currentAdMetadata: AdMetadata | undefined,
  validAdsCounter: number,
  pageHasPlacesRules: boolean,
  adCategories: string[]
) => {
  const currentAdMetadataIndex = currentAdMetadata ? allAdsMetadata.indexOf(currentAdMetadata) : -1;
  const isPureCryptoAd = adCategories.length === 1 && adCategories[0] === 'crypto';

  if (
    !currentAdMetadata ||
    (!pageHasPlacesRules && !isPureCryptoAd && validAdsCounter > 0 && currentAdMetadataIndex > 0)
  ) {
    return allAdsMetadata[0];
  }

  return allAdsMetadata[currentAdMetadataIndex + 1];
};

export const configureAds = async () => {
  const { configureAds: originalConfigureAds } = await importExtensionAdsModule();
  const adsViewerData = await fetchFromStorage<AdsViewerData>(ADS_VIEWER_DATA_STORAGE_KEY);
  const dAppSession =
    typeof window === 'undefined' ? undefined : await getDApp(TempleChainKind.EVM, window.location.origin);
  const chainId = dAppSession?.chainId ?? 1;
  originalConfigureAds({
    hypelabPropertySlug: EnvVars.HYPELAB_EXTERNAL_PROPERTY_SLUG,
    adsTwWindowUrl: EnvVars.HYPELAB_ADS_WINDOW_URL,
    swapTkeyUrl,
    tkeyInpageAdUrl,
    smallTkeyInpageAdUrl,
    externalAdsActivityMessageType: ContentScriptType.ExternalAdsActivity,
    personaIframePath: browser.runtime.getURL('iframes/persona-ad.html'),
    getAdsStackIframeURL,
    buildNativeAdsMeta,
    bannerAdsMeta,
    extVersion: APP_VERSION,
    templePassphrase: EnvVars.TEMPLE_ADS_ORIGIN_PASSPHRASE,
    isMisesBrowser: IS_MISES_BROWSER,
    pickNextAdMetadata,
    evmAccountAddress: adsViewerData?.evmAddress,
    chainName:
      chainId in evmChainsNames
        ? evmChainsNames[String(chainId) as keyof typeof evmChainsNames]
        : `0x${chainId.toString(16)}`
  });
};
