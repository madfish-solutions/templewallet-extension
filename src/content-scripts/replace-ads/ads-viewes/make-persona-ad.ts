import { nanoid } from 'nanoid';
import browser from 'webextension-polyfill';

import { AdDimensions, PersonaAdShape } from '../ads-meta';

import { AdView } from './types';

export const makePersonaAdView = (
  shape: PersonaAdShape,
  { width, height }: AdDimensions,
  elementStyle: StringRecord
): AdView => {
  const id = nanoid();

  const element = document.createElement('iframe');
  element.src = browser.runtime.getURL(`iframes/persona-ad.html?id=${id}&shape=${shape}`);
  element.id = id;

  element.style.width = `${width}px`;
  element.style.height = `${height}px`;
  element.style.border = 'none';

  for (const styleProp in elementStyle) {
    element.style.setProperty(styleProp, elementStyle[styleProp]);
  }

  return { element };
};
