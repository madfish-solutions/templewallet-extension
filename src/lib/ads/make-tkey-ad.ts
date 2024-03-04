import { nanoid } from 'nanoid';
import browser from 'webextension-polyfill';

import { buildSwapPageUrlQuery } from 'app/pages/Swap/utils/build-url-query';
import { TEMPLE_WALLET_AD_ATTRIBUTE_NAME } from 'lib/constants';

const TKeyInpageAd = browser.runtime.getURL(`/misc/ad-banners/tkey-inpage-ad.png`);

const swapTKeyUrl = `${browser.runtime.getURL('fullpage.html')}#/swap?${buildSwapPageUrlQuery(
  'tez',
  'KT1VaEsVNiBoA56eToEK6n6BcPgh1tdx9eXi_0',
  true
)}`;

export const makeTKeyAdElement = (
  slotId: string,
  width: number,
  height: number,
  elementStyle: Record<string, string>
) => {
  const ins = document.createElement('ins');
  ins.id = nanoid();
  ins.style.width = `${width}px`;
  ins.style.height = `${height}px`;
  for (const styleProp in elementStyle) {
    ins.style.setProperty(styleProp, elementStyle[styleProp]);
  }
  ins.setAttribute('data-ad-slot', slotId);
  ins.setAttribute('data-ad-format', `${width}x${height}`);
  ins.setAttribute(TEMPLE_WALLET_AD_ATTRIBUTE_NAME, 'true');

  const div = document.createElement('div');
  div.style.width = `${width}px`;
  div.style.height = `${height}px`;

  ins.appendChild(div);

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

  return ins;
};
