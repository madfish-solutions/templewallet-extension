import { SLISE_AD_PLACEMENT_SLUG } from 'lib/constants';
import { EnvVars } from 'lib/env';

export interface AdsResolution {
  width: number;
  height: number;
  minContainerWidth: number;
  minContainerHeight: number;
  maxContainerWidth: number;
  maxContainerHeight: number;
  placementSlug: string;
}

export const ADS_RESOLUTIONS: AdsResolution[] = [
  {
    width: 320,
    height: 50,
    minContainerWidth: 230,
    minContainerHeight: 32,
    maxContainerWidth: 480,
    maxContainerHeight: 120,
    placementSlug: EnvVars.HYPELAB_SMALL_PLACEMENT_SLUG
  },
  {
    width: 300,
    height: 250,
    minContainerWidth: 210,
    minContainerHeight: 170,
    maxContainerWidth: 400,
    maxContainerHeight: 300,
    placementSlug: EnvVars.HYPELAB_HIGH_PLACEMENT_SLUG
  },
  {
    width: 728,
    height: 90,
    minContainerWidth: 600,
    minContainerHeight: 60,
    maxContainerWidth: 900,
    maxContainerHeight: 120,
    placementSlug: SLISE_AD_PLACEMENT_SLUG
  }
];
