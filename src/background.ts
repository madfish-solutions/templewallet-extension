import 'lib/keep-bg-worker-alive/background';

import { initializeApp } from '@firebase/app';
import { getMessaging } from '@firebase/messaging/sw';
import browser from 'webextension-polyfill';

import { getStoredAppInstallIdentity, putStoredAppInstallIdentity } from 'app/storage/app-install-id';
import { getStoredAppUpdateDetails, putStoredAppUpdateDetails } from 'app/storage/app-update';
import type { DealsState } from 'app/store/deals/state';
import type { PartnersPromotionState } from 'app/store/partners-promotion/state';
import { importUpdateRulesStorageModule } from 'lib/ads/import-update-rules-storage';
import {
  ADS_IMPRESSIONS_LINKED_V2_STORAGE_KEY,
  ANALYTICS_USER_ID_STORAGE_KEY,
  DOUBLE_REWARDS_ENGAGEMENT_LAST_OPENED_VERSION_STORAGE_KEY,
  REWARDS_ACCOUNT_DATA_STORAGE_KEY,
  SHOULD_OPEN_LETS_EXCHANGE_MODAL_STORAGE_KEY,
  SHOULD_PROMOTE_ROOTSTOCK_STORAGE_KEY,
  SHOULD_SHOW_NEW_DAPPS_MODAL_STORAGE_KEY,
  SHOULD_SHOW_REWARDS_PUSH_STORAGE_KEY,
  SIDE_VIEW_WAS_FORCED_STORAGE_KEY
} from 'lib/constants';
import { shouldOpenDoubleRewardsEngagementModal } from 'lib/double-rewards-engagement';
import { EnvVars, IS_SIDE_PANEL_AVAILABLE } from 'lib/env';
import { fetchFromStorage, fetchManyFromStorage, putToStorage } from 'lib/storage';
import { start } from 'lib/temple/back/main';
import { Vault } from 'lib/temple/back/vault';
import { generateKeyPair } from 'lib/utils/ecdsa';
import type { RewardsAddresses } from 'temple/types';

import PackageJSON from '../package.json';

type UpdateStorageKey =
  | typeof SHOULD_OPEN_LETS_EXCHANGE_MODAL_STORAGE_KEY
  | typeof SHOULD_PROMOTE_ROOTSTOCK_STORAGE_KEY
  | typeof SHOULD_SHOW_REWARDS_PUSH_STORAGE_KEY
  | typeof SHOULD_SHOW_NEW_DAPPS_MODAL_STORAGE_KEY;
const updateStorageKeys: UpdateStorageKey[] = [
  SHOULD_OPEN_LETS_EXCHANGE_MODAL_STORAGE_KEY,
  SHOULD_PROMOTE_ROOTSTOCK_STORAGE_KEY,
  SHOULD_SHOW_REWARDS_PUSH_STORAGE_KEY,
  SHOULD_SHOW_NEW_DAPPS_MODAL_STORAGE_KEY
];
const updateStorageKeysToEnsure = [
  SHOULD_OPEN_LETS_EXCHANGE_MODAL_STORAGE_KEY,
  SHOULD_PROMOTE_ROOTSTOCK_STORAGE_KEY,
  SHOULD_SHOW_NEW_DAPPS_MODAL_STORAGE_KEY
] as const;

browser.runtime.onInstalled.addListener(({ reason, previousVersion }) => {
  if (reason === 'install') {
    ensureAppIdentity().finally(openFullPage);
    return;
  }

  if (reason === 'update') {
    void handleExtensionUpdate(previousVersion);

    ensureAppIdentity()
      .then(() => linkAdsImpressionsIfNeeded())
      .catch(() => {});
  }
});

browser.runtime.onUpdateAvailable.addListener(newManifest => {
  putStoredAppUpdateDetails(newManifest);
});

start();

function openFullPage() {
  browser.tabs.create({
    url: browser.runtime.getURL('fullpage.html')
  });
}

async function handleExtensionUpdate(previousVersion?: string) {
  const [details, updateStorage, lastOpenedVersion, hasAccount] = await Promise.all([
    getStoredAppUpdateDetails(),
    fetchManyFromStorage<UpdateStorageKey, Record<UpdateStorageKey, boolean>>(updateStorageKeys),
    fetchFromStorage<string>(DOUBLE_REWARDS_ENGAGEMENT_LAST_OPENED_VERSION_STORAGE_KEY),
    Vault.isExist()
  ]);

  const shouldOpenDoubleRewardsEngagement =
    hasAccount && shouldOpenDoubleRewardsEngagementModal(previousVersion, PackageJSON.version, lastOpenedVersion);

  if (shouldOpenDoubleRewardsEngagement) {
    await Promise.all([
      putToStorage(DOUBLE_REWARDS_ENGAGEMENT_LAST_OPENED_VERSION_STORAGE_KEY, PackageJSON.version),
      putToStorage(SHOULD_SHOW_REWARDS_PUSH_STORAGE_KEY, false)
    ]);
    browser.tabs.create({
      url: browser.runtime.getURL('fullpage.html#/?doubleRewardsEngagementModal=true')
    });
  } else if (details?.triggeredManually) {
    openFullPage();
  }

  const { [SHOULD_SHOW_REWARDS_PUSH_STORAGE_KEY]: shouldShowRewardsPush, ...rest } = updateStorage;
  await Promise.all(
    updateStorageKeysToEnsure.map(key => {
      if (rest[key] == null) return putToStorage(key, true);
      return Promise.resolve();
    })
  );

  if (shouldOpenDoubleRewardsEngagement || shouldShowRewardsPush != null) return;

  const partnersPromoState = await fetchFromStorage<PartnersPromotionState>('persist:root.partnersPromotion');

  if (hasAccount && !partnersPromoState?.shouldShowPromotion) {
    await putToStorage(SHOULD_SHOW_REWARDS_PUSH_STORAGE_KEY, true);
    openFullPage();
  }
}

globalThis.addEventListener('notificationclick', event => {
  // @ts-expect-error
  event.notification.close();
  // @ts-expect-error
  event.waitUntil(clients.openWindow(`${event.target.registration.scope}fullpage.html#/notifications`));
});

const firebase = initializeApp(JSON.parse(EnvVars.TEMPLE_FIREBASE_CONFIG));
getMessaging(firebase);

importUpdateRulesStorageModule()
  .then(module => module.updateRulesStorage())
  .catch(() => {});

async function linkAdsImpressionsIfNeeded() {
  const alreadyLinked = await fetchFromStorage<boolean>(ADS_IMPRESSIONS_LINKED_V2_STORAGE_KEY);
  if (alreadyLinked) return;

  const [partnersPromoState, dealsState] = await Promise.all([
    fetchFromStorage<PartnersPromotionState>('persist:root.partnersPromotion'),
    fetchFromStorage<DealsState>('persist:root.deals')
  ]);

  const promoEnabled = partnersPromoState?.shouldShowPromotion === true;
  const isDealsEnabled = dealsState?.enabled === true;
  if (!promoEnabled && !isDealsEnabled) return;

  const [rewardsAddresses, userId] = await Promise.all([
    fetchFromStorage<RewardsAddresses>(REWARDS_ACCOUNT_DATA_STORAGE_KEY),
    fetchFromStorage<string>(ANALYTICS_USER_ID_STORAGE_KEY)
  ]);

  const { performLinkingOfAdsImpressions } = await import('lib/ads/link-ads-impressions');

  await performLinkingOfAdsImpressions(rewardsAddresses ?? {}, userId ?? undefined);
  await putToStorage(ADS_IMPRESSIONS_LINKED_V2_STORAGE_KEY, true);
}

async function ensureAppIdentity() {
  const existing = await getStoredAppInstallIdentity();
  if (existing) return;

  const { privateKey, publicKey, publicKeyHash } = await generateKeyPair();

  const ts = new Date().toISOString();

  await putStoredAppInstallIdentity({
    version: PackageJSON.version,
    privateKey,
    publicKey,
    publicKeyHash: publicKeyHash.slice(0, 32),
    ts
  });
}

if (IS_SIDE_PANEL_AVAILABLE) {
  (async () => {
    try {
      const [wasForced, vaultExists] = await Promise.all([
        fetchFromStorage<boolean>(SIDE_VIEW_WAS_FORCED_STORAGE_KEY),
        Vault.isExist()
      ]);

      // Forces side view after update from
      // version, where it wasn't available
      if (vaultExists && !wasForced) {
        await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
        await putToStorage(SIDE_VIEW_WAS_FORCED_STORAGE_KEY, true);
      }
    } catch (e) {
      console.error('Failed to set side panel behavior:', e);
    }
  })();
}
