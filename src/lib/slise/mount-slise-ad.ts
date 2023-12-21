import { getSlotId } from './get-slot-id';

let embedScriptLoaded = false;

const PUBLISHER_ID = 'pub-25';

const isTWSliseAd = (element: Element) =>
  element.tagName.toLowerCase() === 'ins' &&
  element.className === 'adsbyslise' &&
  element.attributes.getNamedItem('data-ad-pub')?.value === PUBLISHER_ID;

export const mountSliseAd = (element: HTMLElement, width: number, height: number) => {
  const children = element.children;

  if ([...children].some(isTWSliseAd)) {
    console.warn('Slise Ad already mounted on this element', element);

    return;
  }

  const slotId = getSlotId();
  const ins = document.createElement('ins');
  ins.className = 'adsbyslise';
  ins.style.width = `${width}px`;
  ins.style.height = `${height}px`;
  ins.style.display = 'block';
  ins.setAttribute('data-ad-slot', slotId);
  ins.setAttribute('data-ad-pub', PUBLISHER_ID);
  ins.setAttribute('data-ad-format', `${width}x${height}`);

  const div = document.createElement('div');
  div.style.width = `${width}px`;
  div.style.height = `${height}px`;

  ins.appendChild(div);
  element.replaceChildren(ins);

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
