import { SLISE_AD_PLACEMENT_SLUG } from 'lib/constants';

import { HypelabPlacementType } from './get-hypelab-iframe-url';

interface AdsResolutionBase {
  width: number;
  height: number;
  minContainerWidth: number;
  minContainerHeight: number;
  maxContainerWidth: number;
  maxContainerHeight: number;
}

export interface HypelabAdsResolution extends AdsResolutionBase {
  placementType: HypelabPlacementType;
}

interface SliseAdsResolution extends AdsResolutionBase {
  placementType: typeof SLISE_AD_PLACEMENT_SLUG;
}

export type AdsResolution = HypelabAdsResolution | SliseAdsResolution;

export const ADS_RESOLUTIONS: AdsResolution[] = [
  {
    width: 320,
    height: 50,
    minContainerWidth: 230,
    minContainerHeight: 32,
    maxContainerWidth: 480,
    maxContainerHeight: 120,
    placementType: HypelabPlacementType.Small
  },
  {
    width: 300,
    height: 250,
    minContainerWidth: 210,
    minContainerHeight: 170,
    maxContainerWidth: 400,
    maxContainerHeight: 300,
    placementType: HypelabPlacementType.High
  },
  {
    width: 728,
    height: 90,
    minContainerWidth: 600,
    minContainerHeight: 60,
    maxContainerWidth: 900,
    maxContainerHeight: 120,
    placementType: SLISE_AD_PLACEMENT_SLUG
  }
];
