import { EnvVars } from 'lib/env';

import type { HypeLabAdSources } from './get-ads-actions/helpers';

/**
 * Returns URL for Hypelab ad iframe
 * @param placementType Placement type
 * @param origin Full URL of the page
 * @param width Frame width
 * @param height Frame height
 */
export const getHypelabIframeUrl = (source: HypeLabAdSources, origin: string, width?: number, height?: number) => {
  let defaultWidth: number, defaultHeight: number, placementSlug: string;

  if (source.native) {
    placementSlug = EnvVars.HYPELAB_NATIVE_PLACEMENT_SLUG;
    defaultWidth = 360;
    defaultHeight = 110;
  } else
    switch (source.size) {
      case 'small':
        defaultWidth = 320;
        defaultHeight = 50;
        placementSlug = EnvVars.HYPELAB_SMALL_PLACEMENT_SLUG;
        break;
      case 'high':
        defaultWidth = 300;
        defaultHeight = 250;
        placementSlug = EnvVars.HYPELAB_HIGH_PLACEMENT_SLUG;
        break;
      case 'wide':
        defaultWidth = 728;
        defaultHeight = 90;
        placementSlug = EnvVars.HYPELAB_WIDE_PLACEMENT_SLUG;
        break;
    }

  const url = new URL(EnvVars.HYPELAB_ADS_WINDOW_URL);
  url.searchParams.set('w', String(width ?? defaultWidth));
  url.searchParams.set('h', String(height ?? defaultHeight));
  url.searchParams.set('p', placementSlug);
  url.searchParams.set('o', origin);

  return url.toString();
};
