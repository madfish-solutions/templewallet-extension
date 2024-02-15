import { AD_SEEN_THRESHOLD } from 'lib/constants';

export const adRectIsSeen = (element: Element) => {
  const elementRect = element.getBoundingClientRect();
  const viewport = window.visualViewport;
  const intersectionX0 = Math.min(Math.max(0, elementRect.x), viewport.width);
  const intersectionX1 = Math.min(Math.max(0, elementRect.x + elementRect.width), viewport.width);
  const intersectionY0 = Math.min(Math.max(0, elementRect.y), viewport.height);
  const intersectionY1 = Math.min(Math.max(0, elementRect.y + elementRect.height), viewport.height);
  const elementArea = elementRect.width * elementRect.height;
  const intersectionArea = (intersectionX1 - intersectionX0) * (intersectionY1 - intersectionY0);

  return intersectionArea / elementArea >= AD_SEEN_THRESHOLD;
};
