import { SLISE_PUBLISHER_ID } from 'lib/constants';

let embedScriptLoaded = false;

export const makeSliseAdElement = (slotId: string, width: number, height: number, displayBlock = false) => {
  const ins = document.createElement('ins');
  ins.className = 'adsbyslise';
  ins.style.width = `${width}px`;
  ins.style.height = `${height}px`;
  if (displayBlock) {
    ins.style.display = 'block';
  }
  ins.setAttribute('data-ad-slot', slotId);
  ins.setAttribute('data-ad-pub', SLISE_PUBLISHER_ID);
  ins.setAttribute('data-ad-format', `${width}x${height}`);

  const div = document.createElement('div');
  div.style.width = `${width}px`;
  div.style.height = `${height}px`;

  ins.appendChild(div);

  return ins;
};

/** Call this method after creating a DOM element for ad and adding it to the tree */
export const registerAd = (slotId: string) => {
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
