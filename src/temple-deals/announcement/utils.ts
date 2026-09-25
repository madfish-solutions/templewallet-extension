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
