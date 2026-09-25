import { browser } from 'lib/browser';

export const OBJKT_NOTIFICATION_FALLBACK_IMAGE_URL = browser.runtime.getURL('misc/objkt-notification-fallback.svg');

const isSafeHttpUrl = (url: string) => /^https?:/i.test(url);

export const subscribeAccountNotificationImageSrc = (
  extensionImageUrl: string,
  onSrc: (src: string) => void
): EmptyFn => {
  onSrc(OBJKT_NOTIFICATION_FALLBACK_IMAGE_URL);

  if (!isSafeHttpUrl(extensionImageUrl)) {
    return () => {};
  }

  let cancelled = false;
  const loader = new Image();
  loader.onload = () => {
    if (!cancelled) {
      onSrc(extensionImageUrl);
    }
  };
  loader.src = extensionImageUrl;

  return () => {
    cancelled = true;
    loader.onload = null;
  };
};

export const bindAccountNotificationImage = (image: HTMLImageElement, extensionImageUrl: string): EmptyFn =>
  subscribeAccountNotificationImageSrc(extensionImageUrl, src => {
    image.src = src;
  });
