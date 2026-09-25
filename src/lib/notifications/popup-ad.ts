import { browser } from 'lib/browser';
import { ContentScriptType } from 'lib/constants';

export const ACCOUNT_NOTIFICATION_POPUP_AD_PAGE_NAME = 'Account notification popup';
export const ACCOUNT_NOTIFICATION_POPUP_AD_IMPRESSION_EVENT = 'Account Notification Popup Ad Impression';
export const ACCOUNT_NOTIFICATION_POPUP_AD_PROVIDER = 'HypeLab';
export const ACCOUNT_NOTIFICATION_POPUP_AD_WIDTH = 344;
export const ACCOUNT_NOTIFICATION_POPUP_AD_HEIGHT = 72;
export const ACCOUNT_NOTIFICATION_POPUP_AD_FAIL_TIMEOUT_MS = 6_000;
export const ACCOUNT_NOTIFICATION_POPUP_AD_SUCCESS_MESSAGE_TYPES = ['ready', 'resize', 'impression'];

export interface AccountNotificationAdContext {
  adUrl: string | null;
}

export const getHypeLabIframeMessageType = (data: unknown): string | undefined => {
  let value: unknown = data;
  if (typeof data === 'string') {
    try {
      value = JSON.parse(data);
    } catch {
      return undefined;
    }
  }
  if (typeof value === 'object' && value !== null && 'type' in value && typeof value.type === 'string') {
    return value.type;
  }

  return undefined;
};

const AD_CONTEXT_CACHE_MS = 30_000;

let cachedAdContext: { expiresAt: number; value: Promise<AccountNotificationAdContext> } | undefined;

export const getAccountNotificationAdContext = (): Promise<AccountNotificationAdContext> => {
  const now = Date.now();
  if (cachedAdContext && cachedAdContext.expiresAt > now) {
    return cachedAdContext.value;
  }

  const value = browser.runtime.sendMessage({
    type: ContentScriptType.AccountNotificationAdContext
  });
  cachedAdContext = { expiresAt: now + AD_CONTEXT_CACHE_MS, value };

  return value;
};

export const postAccountNotificationAdImpression = (provider: string): Promise<void> =>
  browser.runtime.sendMessage({
    type: ContentScriptType.AccountNotificationAdImpression,
    provider
  });
