import { EnvVars } from 'lib/env';

export enum HypelabPlacementType {
  Small = 'small',
  High = 'high',
  Wide = 'wide',
  Native = 'native'
}

/**
 * Returns URL for Hypelab ad iframe
 * @param placementType Placement type
 * @param origin Full URL of the page
 * @param width Frame width
 * @param height Frame height
 */
export const getHypelabIframeUrl = (
  placementType: HypelabPlacementType,
  origin: string,
  width?: number,
  height?: number,
  id?: string
) => {
  let defaultWidth: number, defaultHeight: number, placementSlug: string;
  switch (placementType) {
    case HypelabPlacementType.Small:
      defaultWidth = 320;
      defaultHeight = 50;
      placementSlug = EnvVars.HYPELAB_SMALL_PLACEMENT_SLUG;
      break;
    case HypelabPlacementType.High:
      defaultWidth = 300;
      defaultHeight = 250;
      placementSlug = EnvVars.HYPELAB_HIGH_PLACEMENT_SLUG;
      break;
    case HypelabPlacementType.Wide:
      defaultWidth = 728;
      defaultHeight = 90;
      placementSlug = EnvVars.HYPELAB_WIDE_PLACEMENT_SLUG;
      break;
    default:
      placementSlug = EnvVars.HYPELAB_NATIVE_PLACEMENT_SLUG;
      defaultWidth = 360;
      defaultHeight = 110;
  }
  const url = new URL(EnvVars.HYPELAB_ADS_WINDOW_URL);
  url.searchParams.set('w', String(width ?? defaultWidth));
  url.searchParams.set('h', String(height ?? defaultHeight));
  url.searchParams.set('p', placementSlug);
  url.searchParams.set('o', origin);
  if (id) {
    url.searchParams.set('id', id);
  }

  return url.toString();
};
