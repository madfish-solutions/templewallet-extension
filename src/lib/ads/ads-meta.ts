import { EnvVars } from 'lib/env';

export interface HypeLabBannerAdSource {
  providerName: 'HypeLab';
  native: false;
  size: 'small' | 'high' | 'wide';
}

export interface HypeLabNativeAdSource {
  providerName: 'HypeLab';
  native: true;
  slug: string;
}

/** Only covers TKEY ads for now */
interface TempleAdSource {
  providerName: 'Temple';
}

export type HypeLabAdSources = HypeLabBannerAdSource | HypeLabNativeAdSource;

export type AdSource = HypeLabAdSources | TempleAdSource;

export interface AdDimensions {
  width: number;
  height: number;
  minContainerWidth: number;
  minContainerHeight: number;
  maxContainerWidth: number;
  maxContainerHeight: number;
}

export interface AdMetadata {
  source: AdSource;
  dimensions: AdDimensions;
}

export const BANNER_ADS_META: AdMetadata[] = [
  {
    source: {
      providerName: 'Temple'
    },
    dimensions: {
      width: 728,
      height: 90,
      minContainerWidth: 600,
      minContainerHeight: 60,
      maxContainerWidth: 900,
      maxContainerHeight: 120
    }
  },
  {
    source: {
      providerName: 'HypeLab',
      native: false,
      size: 'high'
    },
    dimensions: {
      width: 300,
      height: 250,
      minContainerWidth: 210,
      minContainerHeight: 170,
      maxContainerWidth: 400,
      maxContainerHeight: 300
    }
  },
  {
    source: {
      providerName: 'HypeLab',
      native: false,
      size: 'small'
    },
    dimensions: {
      width: 320,
      height: 50,
      minContainerWidth: 230,
      minContainerHeight: 32,
      maxContainerWidth: 480,
      maxContainerHeight: 120
    }
  }
];

export const isHypeLabBannerSource = (source: AdSource): source is HypeLabBannerAdSource =>
  source.providerName === 'HypeLab' && !source.native;

export const buildHypeLabNativeMeta = (containerWidth: number, containerHeight: number) => ({
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
});
