import { nanoid } from 'nanoid';
import browser from 'webextension-polyfill';

import { buildSwapPageUrlQuery } from 'app/pages/Swap/utils/build-url-query';

import { AdView } from './types';

const TKeyInpageAd = browser.runtime.getURL(`/misc/ad-banners/tkey-inpage-ad.png`);

const swapTKeyUrl = `${browser.runtime.getURL('fullpage.html')}#/swap?${buildSwapPageUrlQuery(
  'tez',
  'KT1VaEsVNiBoA56eToEK6n6BcPgh1tdx9eXi_0',
  true
)}`;

export const makeTKeyAdView = (width: number, height: number, elementStyle: StringRecord): AdView => {
  const element = document.createElement('div');
  element.id = nanoid();
  element.style.width = `${width}px`;
  element.style.height = `${height}px`;
  for (const styleProp in elementStyle) {
    element.style.setProperty(styleProp, elementStyle[styleProp]);
  }

  const div = document.createElement('div');
  div.style.width = `${width}px`;
  div.style.height = `${height}px`;

  element.appendChild(div);

  const anchor = document.createElement('a');
  anchor.href = swapTKeyUrl;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.style.width = '100%';
  anchor.style.height = '100%';
  div.appendChild(anchor);

  const img = document.createElement('img');
  img.src = TKeyInpageAd;
  img.style.width = '100%';
  img.style.height = '100%';
  anchor.appendChild(img);

  return { element };
};
