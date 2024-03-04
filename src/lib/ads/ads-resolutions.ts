import { TKEY_AD_PLACEMENT_SLUG } from 'lib/constants';

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

interface TKeyAdsResolution extends AdsResolutionBase {
  placementType: typeof TKEY_AD_PLACEMENT_SLUG;
}

export type AdsResolution = HypelabAdsResolution | TKeyAdsResolution;

export const ADS_RESOLUTIONS: AdsResolution[] = [
  {
    width: 320,
    height: 50,
    minContainerWidth: 230,
    minContainerHeight: 32,
    maxContainerWidth: 420,
    maxContainerHeight: 110,
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
    maxContainerWidth: 1440,
    maxContainerHeight: 110,
    placementType: TKEY_AD_PLACEMENT_SLUG
  }
];
