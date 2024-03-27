import browser from 'webextension-polyfill';

import { AdsProviderName, AdsProviderTitle } from 'lib/ads';
import { AD_SEEN_THRESHOLD, ContentScriptType } from 'lib/constants';

const loadingAdsIds = new Set();
const loadedAdsIds = new Set();
const alreadySentAnalyticsAdsIds = new Set();

const IFRAME_READY_TIMEOUT = 10_000;

export const subscribeToIframeLoadIfNecessary = (
  adId: string,
  providerName: AdsProviderName,
  element: HTMLIFrameElement
) => {
  if (loadingAdsIds.has(adId)) {
    return;
  }

  loadingAdsIds.add(adId);

  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      window.removeEventListener('message', messageListener);
      reject(new Error(`Timeout exceeded for ${adId}`));
    }, IFRAME_READY_TIMEOUT);

    const messageListener = (event: MessageEvent<any>) => {
      if (event.source !== element.contentWindow) return;

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        if (data.id !== adId) return;

        if (data.type === 'ready') {
          window.removeEventListener('message', messageListener);
          resolve();
        } else if (data.type === 'error') {
          window.removeEventListener('message', messageListener);
          reject(new Error(data.reason ?? 'Unknown error'));
        }
      } catch (error) {
        console.error('Observing error:', error);
      }
    };

    window.addEventListener('message', messageListener);
  })
    .then(() => {
      if (loadedAdsIds.has(adId)) return;

      loadedAdsIds.add(adId);
      const adIsSeen = adRectIsSeen(element);

      if (adIsSeen) {
        sendExternalAdsActivity(adId, providerName);
      } else {
        observeIntersection(element, providerName);
      }
    })
    .finally(() => void loadingAdsIds.delete(adId));
};

export const observeIntersection = (element: HTMLElement, providerName: AdsProviderName) => {
  const observer = new IntersectionObserver(
    entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        sendExternalAdsActivity(element.id, providerName);
        observer.disconnect();
      }
    },
    { threshold: AD_SEEN_THRESHOLD }
  );

  observer.observe(element);
};

const sendExternalAdsActivity = (adId: string, providerName: AdsProviderName) => {
  if (alreadySentAnalyticsAdsIds.has(adId)) {
    return;
  }

  alreadySentAnalyticsAdsIds.add(adId);

  const url = window.parent.location.href;

  browser.runtime
    .sendMessage({
      type: ContentScriptType.ExternalAdsActivity,
      url,
      provider: AdsProviderTitle[providerName]
    })
    .catch(err => void console.error(err));
};

const adRectIsSeen = (element: Element) => {
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
