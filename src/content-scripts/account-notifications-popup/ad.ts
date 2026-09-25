import { el } from 'lib/el';
import { msg } from 'lib/msg';
import {
  ACCOUNT_NOTIFICATION_POPUP_AD_FAIL_TIMEOUT_MS,
  ACCOUNT_NOTIFICATION_POPUP_AD_PROVIDER,
  ACCOUNT_NOTIFICATION_POPUP_AD_SUCCESS_MESSAGE_TYPES,
  getAccountNotificationAdContext,
  getHypeLabIframeMessageType,
  postAccountNotificationAdImpression
} from 'lib/notifications';

const AD_SANDBOX = 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox';

export const appendAccountNotificationAd = (parent: HTMLElement): EmptyFn => {
  let wrap: HTMLDivElement | undefined;
  let iframe: HTMLIFrameElement | undefined;
  let failTimer: ReturnType<typeof setTimeout> | undefined;
  let impressionFired = false;
  let cancelled = false;

  const showFallback = () => {
    if (!wrap) return;
    wrap.replaceChildren();
    wrap.className = 'ad ad-fallback';
    wrap.append(el('p', 'ad-fallback-text', msg('thanksForSupportingTemple')));
  };

  const onMessage = (event: MessageEvent) => {
    if (event.source !== iframe?.contentWindow) return;
    const type = getHypeLabIframeMessageType(event.data);
    if (!type) return;

    if (ACCOUNT_NOTIFICATION_POPUP_AD_SUCCESS_MESSAGE_TYPES.includes(type)) {
      if (failTimer !== undefined) {
        clearTimeout(failTimer);
        failTimer = undefined;
      }
      wrap?.querySelector('.ad-loader')?.remove();
    }

    if (type === 'error') {
      if (failTimer !== undefined) {
        clearTimeout(failTimer);
        failTimer = undefined;
      }
      showFallback();
    }

    if (type === 'impression' && !impressionFired) {
      impressionFired = true;
      postAccountNotificationAdImpression(ACCOUNT_NOTIFICATION_POPUP_AD_PROVIDER).catch(() => {});
    }
  };

  window.addEventListener('message', onMessage);

  void getAccountNotificationAdContext()
    .then(context => {
      if (cancelled || !parent.isConnected || !context.adUrl) {
        return;
      }

      wrap = el('div', 'ad');
      wrap.addEventListener('click', event => event.stopPropagation());

      const loader = el('div', 'ad-loader');
      loader.append(el('span', 'ad-spinner'));

      iframe = el('iframe', 'ad-iframe');
      iframe.title = 'Ad';
      iframe.setAttribute('sandbox', AD_SANDBOX);
      iframe.src = context.adUrl;

      wrap.append(loader, iframe);
      parent.append(wrap);
      failTimer = setTimeout(showFallback, ACCOUNT_NOTIFICATION_POPUP_AD_FAIL_TIMEOUT_MS);
    })
    .catch(() => undefined);

  return () => {
    cancelled = true;
    if (failTimer !== undefined) {
      clearTimeout(failTimer);
    }
    window.removeEventListener('message', onMessage);
  };
};
