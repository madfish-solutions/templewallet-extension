import { nanoid } from 'nanoid';

import { EnvVars } from 'lib/env';

import { AdDimensions, HypeLabAdSources } from '../ads-meta';

import { AdView } from './types';

export const makeHypelabAdView = (
  source: HypeLabAdSources,
  dimensions: AdDimensions,
  elementStyle: StringRecord
): AdView => {
  const { width, height } = dimensions;

  const iframe = document.createElement('iframe');
  iframe.id = nanoid();
  iframe.src = getHypelabIframeUrl(source, window.location.href, width, height, iframe.id);
  iframe.style.width = `${width}px`;
  iframe.style.height = `${height}px`;
  iframe.style.border = 'none';
  for (const styleProp in elementStyle) {
    iframe.style.setProperty(styleProp, elementStyle[styleProp]);
  }

  return { element: iframe };
};

/**
 * Returns URL for Hypelab ad iframe
 * @param placementType Placement type
 * @param origin Full URL of the page
 * @param width Frame width
 * @param height Frame height
 */
const getHypelabIframeUrl = (
  source: HypeLabAdSources,
  origin: string,
  width?: number,
  height?: number,
  id?: string
) => {
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
  if (id) {
    url.searchParams.set('id', id);
  }

  return url.toString();
};
