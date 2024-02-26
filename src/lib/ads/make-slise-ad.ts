import { nanoid } from 'nanoid';

import { SLISE_PUBLISHER_ID, TEMPLE_WALLET_AD_ATTRIBUTE_NAME } from 'lib/constants';

let embedScriptLoaded = false;

export const makeSliseAdElement = (
  slotId: string,
  width: number,
  height: number,
  elementStyle: Record<string, string>
) => {
  const ins = document.createElement('ins');
  ins.className = 'adsbyslise';
  ins.id = nanoid();
  ins.style.width = `${width}px`;
  ins.style.height = `${height}px`;
  for (const styleProp in elementStyle) {
    ins.style.setProperty(styleProp, elementStyle[styleProp]);
  }
  ins.setAttribute('data-ad-slot', slotId);
  ins.setAttribute('data-ad-pub', SLISE_PUBLISHER_ID);
  ins.setAttribute('data-ad-format', `${width}x${height}`);
  ins.setAttribute(TEMPLE_WALLET_AD_ATTRIBUTE_NAME, 'true');

  const div = document.createElement('div');
  div.style.width = `${width}px`;
  div.style.height = `${height}px`;

  ins.appendChild(div);

  return ins;
};

/** Call this method after creating a DOM element for ad and adding it to the tree */
export const registerSliseAd = (slotId: string) => {
  if (!embedScriptLoaded) {
    require('./slise-ad.embed');
    embedScriptLoaded = true;
  }

  if (!window.adsbyslise) {
    window.adsbyslise = [];
  }
  window.adsbyslise.push({ slot: slotId });
  if (window.adsbyslisesync) {
    window.adsbyslisesync();
  }
};
