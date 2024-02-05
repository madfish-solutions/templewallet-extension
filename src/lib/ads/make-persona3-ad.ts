import { persona3AdClient } from 'lib/persona3-client';

const dimensionsToAdUnitIds: Record<string, string> = {
  '600*160': 'cf20c750-2fe4-4761-861f-b73b2247fd4d',
  '300*250': 'bf498e26-eb16-4e35-8954-e65690f28819',
  '970*90': '3a094192-4c7b-4761-a50c-bd9b6a67e987'
};

const getAdUnitId = (width: number, height: number) => {
  const dimension = `${width}*${height}`;

  return dimensionsToAdUnitIds[dimension] ?? 'bf498e26-eb16-4e35-8954-e65690f28819';
};

export const makePersona3AdElement = (width: number, height: number, displayBlock = false, addIndex: number) => {
  const ins = document.createElement('ins');
  ins.className = 'adsbyslise';
  ins.style.width = `${width}px`;
  ins.style.height = `${height}px`;
  if (displayBlock) {
    ins.style.display = 'block';
  }

  const div = document.createElement('div');
  div.id = `persona3-ad-${addIndex}`;
  div.style.width = `${width}px`;
  div.style.height = `${height}px`;

  ins.appendChild(div);

  return ins;
};

/** Call this method after creating a DOM element for ad and adding it to the tree */
export const showPersona3Ad = (width: number, height: number, addIndex: number) =>
  persona3AdClient.showBannerAd({ adUnitId: getAdUnitId(width, height), containerId: `persona3-ad-${addIndex}` });
