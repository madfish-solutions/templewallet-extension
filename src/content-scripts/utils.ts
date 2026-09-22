import {
  ADS_VIEWER_DATA_STORAGE_KEY,
  AI_CHATBOT_ADS_ENABLED,
  AI_CHATBOT_ADS_ENABLED_DOMAINS_STORAGE_KEY,
  WEBSITES_ADS_ENABLED
} from 'lib/constants';
import { IS_MISES_BROWSER } from 'lib/env';
import { fetchFromStorage } from 'lib/storage';
import type { AdsViewerData } from 'temple/types';

export async function checkIfAccountExists() {
  const adsViewerData = await fetchFromStorage<AdsViewerData>(ADS_VIEWER_DATA_STORAGE_KEY);

  return Boolean(adsViewerData?.tezosAddress || adsViewerData?.evmAddress);
}

const hasAccountForAds = async () => {
  const accountDataFromStorage = await fetchFromStorage<string>(ADS_VIEWER_DATA_STORAGE_KEY);

  return Boolean(accountDataFromStorage);
};

const resolveInBrowserAdsEnabled = async () => {
  const websitesAdsEnabled = await fetchFromStorage<boolean>(WEBSITES_ADS_ENABLED);

  if (await hasAccountForAds()) return websitesAdsEnabled ?? false;

  return IS_MISES_BROWSER;
};

const resolveAiChatAdsEnabled = async () => {
  const accountExists = await hasAccountForAds();
  if (!accountExists && !IS_MISES_BROWSER) return false;

  const aiChatAdsEnabled = await fetchFromStorage<boolean>(AI_CHATBOT_ADS_ENABLED);
  if (typeof aiChatAdsEnabled === 'boolean') return aiChatAdsEnabled;

  const enabledDomains = (await fetchFromStorage<string[]>(AI_CHATBOT_ADS_ENABLED_DOMAINS_STORAGE_KEY)) ?? [];

  return Array.isArray(enabledDomains) && enabledDomains.length > 0;
};

export function checkIfShouldReplaceInBrowserAds() {
  return runInMainWindow(resolveInBrowserAdsEnabled);
}

export function checkIfShouldReplaceAiChatAds() {
  return runInMainWindow(resolveAiChatAdsEnabled);
}

export function checkIfShouldReplaceTempleReferrals() {
  // For now, it's unclear when this feature will be enabled
  return runInMainWindow(() => Promise.resolve(false));
}

export function runWhenDocumentIsActive(callback: () => void) {
  const prerenderingDocument = document as Document & { prerendering?: boolean };

  if (!prerenderingDocument.prerendering) {
    callback();
    return;
  }

  document.addEventListener('prerenderingchange', callback, { once: true });
}

async function runInMainWindow(callback: () => Promise<boolean>) {
  if (window.frameElement) return false; // Prevents the scripts from running in an Iframe

  return callback();
}
