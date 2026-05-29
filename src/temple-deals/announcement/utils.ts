import { browser } from 'lib/browser';
import { ContentScriptType } from 'lib/constants';

export const DEALS_ANNOUNCEMENT_GOOGLE_SEARCH_EVENTS = {
  view: 'DealsAnnouncementGoogleSearchView',
  activate: 'DealsAnnouncementGoogleSearchActivate',
  close: 'DealsAnnouncementGoogleSearchClose'
} as const;

export function trackDealsAnnouncementGoogleSearchEvent(event: string, properties?: object) {
  browser.runtime
    .sendMessage({
      type: ContentScriptType.DealsAnnouncementAnalytics,
      event,
      properties
    })
    .catch(() => {});
}

export const msg = (key: string) => browser.i18n.getMessage(key) || key;

export function el(tag: string, className: string, text?: string): HTMLElement {
  const elem = document.createElement(tag);
  if (className) elem.className = className;
  if (text) elem.textContent = text;
  return elem;
}
