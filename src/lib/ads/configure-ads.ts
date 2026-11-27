import { getIntercom } from 'intercom-client';
import browser from 'webextension-polyfill';

import { buildSwapPagePath } from 'app/pages/Swap/build-url-query';
import { getDApp } from 'app/storage/dapps';
import {
  AD_CATEGORIES_PARAM_NAME,
  ADS_META_SEARCH_PARAM_NAME,
  BACKGROUND_COLOR_SEARCH_PARAM_NAME,
  CHAIN_NAME_SEARCH_PARAM_NAME,
  EVM_ACCOUNT_SEARCH_PARAM_NAME,
  FONT_SIZE_SEARCH_PARAM_NAME,
  LINE_HEIGHT_SEARCH_PARAM_NAME,
  ORIGIN_SEARCH_PARAM_NAME,
  THEME_COLOR_SEARCH_PARAM_NAME
} from 'lib/ads-constants/ads-constants';
import { ADS_VIEWER_DATA_STORAGE_KEY, ContentScriptType } from 'lib/constants';
import { APP_VERSION, EnvVars, IS_DEV_ENV, IS_MISES_BROWSER } from 'lib/env';
import { fetchFromStorage } from 'lib/storage';
import {
  TempleAnalyzeYoutubeSearchPageData,
  TempleAnalyzeYoutubeWatchPageData,
  TempleMessageType,
  TEZOS_MAINNET_CHAIN_ID
} from 'lib/temple/types';
import { isTruthy } from 'lib/utils';
import { TempleChainKind, type AdsViewerData } from 'temple/types';

// TODO: Fetch them from CDN for ads data
import evmChainsNames from './evm-chains-names.json';
import { importExtensionAdsModule } from './import-extension-ads-module';

// #region These interfaces below are copied from '@temple-wallet/extension-ads' or based on this module to avoid
// importing it to ensure that a core build runs without errors.
interface AdSource {
  providerName: 'Temple' | 'HypeLab' | 'Bitmedia';
  native?: boolean;
  slug: string;
  categories?: string[];
}

interface AdDimensions {
  width: number;
  height: number;
  maxContainerWidth: number;
  maxContainerHeight: number;
}

interface AdMetadata {
  source: AdSource;
  dimensions: AdDimensions;
}

interface AdsStackIframeURLParams {
  placementKind?: 'selector';
  id: string;
  adsMetadataIds: any[];
  origin: string;
  adCategories: string[];
  themeColor?: string;
  backgroundColor?: string;
  fontSize?: number;
  lineHeight?: number;
  evmAccountAddress?: string;
  chainName?: string;
}

interface AdThemeParams {
  themeColor?: string;
  backgroundColor?: string;
  fontSize?: number;
  lineHeight?: number;
}
// #endregion

const smallTkeyInpageAdUrl = browser.runtime.getURL(`/misc/ad-banners/small-tkey-inpage-ad.png`);
const tkeyInpageAdUrl = browser.runtime.getURL(`/misc/ad-banners/tkey-inpage-ad.png`);

const swapTkeyUrl = `${browser.runtime.getURL('fullpage.html')}#${buildSwapPagePath(
  { chainKind: 'tezos', chainId: TEZOS_MAINNET_CHAIN_ID, assetSlug: 'tez' },
  { chainKind: 'tezos', chainId: TEZOS_MAINNET_CHAIN_ID, assetSlug: 'KT1VaEsVNiBoA56eToEK6n6BcPgh1tdx9eXi_0' },
  true
)}`;

const searchParamsNames = {
  placementKind: 'placementKind',
  id: 'id',
  themeColor: THEME_COLOR_SEARCH_PARAM_NAME,
  backgroundColor: BACKGROUND_COLOR_SEARCH_PARAM_NAME,
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

const youtubeHostnames = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com']);
const isYouTubePage = (locationHref: string) => {
  const hostname = new URL(locationHref).hostname;

  return youtubeHostnames.has(hostname);
};

const NATIVE_AD_DIMENSIONS = {
  width: 200,
  height: 16,
  maxContainerWidth: 1200,
  maxContainerHeight: 200
};

// Keep wide native slots from leaving large blank areas.
const nativeAdFitsSlot = (width: number, height: number): boolean => {
  const { width: minWidth, height: minHeight, maxContainerWidth: maxWidth, maxContainerHeight } = NATIVE_AD_DIMENSIONS;
  if (!(width >= minWidth && width <= maxWidth && height >= minHeight)) return false;

  const widthBeyondSquare = Math.max(width - maxContainerHeight, 0);
  const heightDrop = (widthBeyondSquare * (maxContainerHeight - minHeight)) / (maxWidth - maxContainerHeight);

  return height <= maxContainerHeight - heightDrop;
};

export const buildNativeAdsMeta = (containerWidth: number, containerHeight: number, locationHref: string) => {
  const hypelabPlacementSlug = isYouTubePage(locationHref)
    ? EnvVars.HYPELAB_INTERNAL_NATIVE_PLACEMENT_SLUG
    : EnvVars.HYPELAB_EXTERNAL_NATIVE_PLACEMENT_SLUG;

  return [
    {
      source: {
        providerName: 'HypeLab' as const,
        native: true as const,
        slug: hypelabPlacementSlug
      },
      dimensions: {
        ...NATIVE_AD_DIMENSIONS,
        width: Math.max(NATIVE_AD_DIMENSIONS.width, containerWidth),
        height: Math.max(NATIVE_AD_DIMENSIONS.height, containerHeight)
      }
    },
    EnvVars.USE_ADS_STUBS && {
      source: {
        providerName: 'Temple' as const,
        slug: '',
        native: true as const
      },
      dimensions: {
        ...NATIVE_AD_DIMENSIONS,
        width: Math.max(NATIVE_AD_DIMENSIONS.width, containerWidth),
        height: Math.max(NATIVE_AD_DIMENSIONS.height, containerHeight)
      }
    }
  ].filter(isTruthy);
};

const createBanner = (
  providerName: AdSource['providerName'],
  slug: string,
  width: number,
  height: number,
  maxContainerWidth: number,
  maxContainerHeight: number
): AdMetadata => ({
  source: { providerName, native: false, slug },
  dimensions: { width, height, maxContainerWidth, maxContainerHeight }
});

const hypelabBanner = createBanner.bind(null, 'HypeLab');

const bitmediaBanner = (
  slug: string | undefined,
  width: number,
  height: number,
  maxContainerWidth: number,
  maxContainerHeight: number
): AdMetadata | false =>
  isTruthy(slug) && createBanner('Bitmedia', slug, width, height, maxContainerWidth, maxContainerHeight);

// List order sets banner priority. Try Bitmedia first, then HypeLab at the same size if Bitmedia fails.
const bannerAdsMetaBase: (AdMetadata | false)[] = [
  bitmediaBanner(EnvVars.BITMEDIA_970_90_PLACEMENT_ID, 970, 90, 1400, 200),
  bitmediaBanner(EnvVars.BITMEDIA_728_90_PLACEMENT_ID, 728, 90, 1200, 200),
  bitmediaBanner(EnvVars.BITMEDIA_300_600_PLACEMENT_ID, 300, 600, 500, 800),
  bitmediaBanner(EnvVars.BITMEDIA_160_600_PLACEMENT_ID, 160, 600, 360, 800),
  bitmediaBanner(EnvVars.BITMEDIA_336_280_PLACEMENT_ID, 336, 280, 446, 380),
  bitmediaBanner(EnvVars.BITMEDIA_300_250_PLACEMENT_ID, 300, 250, 400, 350),
  bitmediaBanner(EnvVars.BITMEDIA_250_250_PLACEMENT_ID, 250, 250, 450, 450),
  bitmediaBanner(EnvVars.BITMEDIA_320_100_PLACEMENT_ID, 320, 100, 420, 200),
  bitmediaBanner(EnvVars.BITMEDIA_300_100_PLACEMENT_ID, 300, 100, 400, 200),
  bitmediaBanner(EnvVars.BITMEDIA_320_50_PLACEMENT_ID, 320, 50, 420, 130),
  bitmediaBanner(EnvVars.BITMEDIA_468_60_PLACEMENT_ID, 468, 60, 600, 89),
  bitmediaBanner(EnvVars.BITMEDIA_468_90_PLACEMENT_ID, 468, 90, 600, 150),
  bitmediaBanner(EnvVars.BITMEDIA_125_125_PLACEMENT_ID, 125, 125, 179, 149),
  bitmediaBanner(EnvVars.BITMEDIA_180_150_PLACEMENT_ID, 180, 150, 220, 199),
  bitmediaBanner(EnvVars.BITMEDIA_200_200_PLACEMENT_ID, 200, 200, 249, 280),
  bitmediaBanner(EnvVars.BITMEDIA_250_100_PLACEMENT_ID, 250, 100, 299, 200),
  bitmediaBanner(EnvVars.BITMEDIA_120_240_PLACEMENT_ID, 120, 240, 159, 360),
  bitmediaBanner(EnvVars.BITMEDIA_120_600_PLACEMENT_ID, 120, 600, 159, 800),
  bitmediaBanner(EnvVars.BITMEDIA_320_1200_PLACEMENT_ID, 320, 1200, 420, 1400),

  hypelabBanner(EnvVars.HYPELAB_WIDE_PLACEMENT_SLUG, 728, 90, 1200, 200),
  hypelabBanner(EnvVars.HYPELAB_HIGH_PLACEMENT_SLUG, 300, 250, 400, 350),
  hypelabBanner(EnvVars.HYPELAB_EXTERNAL_MEDIUM_PLACEMENT_SLUG, 320, 100, 420, 200),
  hypelabBanner(EnvVars.HYPELAB_EXTERNAL_SMALL_PLACEMENT_SLUG, 320, 50, 420, 130),

  EnvVars.USE_ADS_STUBS && {
    source: {
      providerName: 'Temple' as const,
      slug: ''
    },
    dimensions: {
      width: 320,
      height: 50,
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
  const configuration = {
    debugAds: IS_DEV_ENV,
    hypelabPropertySlug: (locationHref: string) =>
      isYouTubePage(locationHref) ? EnvVars.HYPELAB_PROPERTY_SLUG : EnvVars.HYPELAB_EXTERNAL_PROPERTY_SLUG,
    adsTwWindowUrl: EnvVars.HYPELAB_ADS_WINDOW_URL,
    swapTkeyUrl,
    tkeyInpageAdUrl,
    smallTkeyInpageAdUrl,
    externalAdsActivityMessageType: ContentScriptType.ExternalAdsActivity,
    getAdsStackIframeURL,
    buildNativeAdsMeta,
    nativeAdFitsSlot,
    bannerAdsMeta,
    extVersion: APP_VERSION,
    templePassphrase: EnvVars.TEMPLE_ADS_ORIGIN_PASSPHRASE,
    isMisesBrowser: IS_MISES_BROWSER,
    pickNextAdMetadata,
    evmAccountAddress: adsViewerData?.evmAddress,
    chainName:
      chainId in evmChainsNames
        ? evmChainsNames[String(chainId) as keyof typeof evmChainsNames]
        : `0x${chainId.toString(16)}`,
    makeThemingParamsChangeMessage: (params: AdThemeParams) => JSON.stringify({ type: 'setParams', params }),
    analyzeYoutubeSearchPage: (data: TempleAnalyzeYoutubeSearchPageData) =>
      getIntercom()
        .request({ type: TempleMessageType.AnalyzeYoutubeSearchPageRequest, data })
        .then(res => res.data),
    analyzeYoutubeVideoPage: (data: TempleAnalyzeYoutubeWatchPageData) =>
      getIntercom()
        .request({ type: TempleMessageType.AnalyzeYoutubeWatchPageRequest, data })
        .then(res => res.data)
  };
  originalConfigureAds(configuration);
};
