import type { PersistedState } from 'redux-persist';

import {
  AI_CHATBOT_ADS_ENABLED,
  AI_CHATBOT_ADS_ENABLED_DOMAINS_STORAGE_KEY,
  PARTNERS_PROMOTION_STORAGE_KEY,
  WEBSITES_ADS_ENABLED
} from 'lib/constants';
import { fetchFromStorage, putManyToStorage, putToStorage, removeFromStorage } from 'lib/storage';

import {
  isAiChatAdsEnabled,
  isInBrowserAdsEnabled,
  partnersPromotionInitialState,
  type PartnersPromotionState
} from './state';

export const PARTNERS_PROMOTION_PERSIST_VERSION = 1;

interface LegacyPersistedPartnersPromotionState extends Partial<PartnersPromotionState> {
  shouldShowPromotion?: boolean;
  _persist?: { version: number; rehydrated: boolean };
}

const hasAdsSurfaceFlags = (state: LegacyPersistedPartnersPromotionState) =>
  typeof state.inWalletAdsEnabled === 'boolean' ||
  typeof state.inBrowserAdsEnabled === 'boolean' ||
  typeof state.aiChatAdsEnabled === 'boolean';

const toPartnersPromotionState = (state: LegacyPersistedPartnersPromotionState): PartnersPromotionState => {
  const next: PartnersPromotionState = {
    inWalletAdsEnabled: Boolean(state.inWalletAdsEnabled),
    inBrowserAdsEnabled: Boolean(state.inBrowserAdsEnabled),
    aiChatAdsEnabled: Boolean(state.aiChatAdsEnabled),
    promotionHidingTimestamps: state.promotionHidingTimestamps ?? {}
  };

  if (state.promotion) next.promotion = state.promotion;

  return next;
};

const syncAdsControlMirrors = (state: PartnersPromotionState) =>
  putManyToStorage({
    [WEBSITES_ADS_ENABLED]: isInBrowserAdsEnabled(state),
    [AI_CHATBOT_ADS_ENABLED]: isAiChatAdsEnabled(state)
  });

const migratePartnersPromotionState = async (
  state: LegacyPersistedPartnersPromotionState
): Promise<PartnersPromotionState> => {
  if (hasAdsSurfaceFlags(state)) {
    const migrated = toPartnersPromotionState(state);
    await syncAdsControlMirrors(migrated);
    await removeFromStorage(AI_CHATBOT_ADS_ENABLED_DOMAINS_STORAGE_KEY);

    return migrated;
  }

  const enabledDomains = (await fetchFromStorage<string[]>(AI_CHATBOT_ADS_ENABLED_DOMAINS_STORAGE_KEY)) ?? [];
  const hasEnabledAiDomains = Array.isArray(enabledDomains) && enabledDomains.length > 0;
  const inWalletAndBrowserEnabled = state.shouldShowPromotion === true;

  const migrated: PartnersPromotionState = {
    inWalletAdsEnabled: inWalletAndBrowserEnabled,
    inBrowserAdsEnabled: inWalletAndBrowserEnabled,
    aiChatAdsEnabled: hasEnabledAiDomains && state.shouldShowPromotion !== false,
    promotionHidingTimestamps: state.promotionHidingTimestamps ?? {}
  };

  if (state.promotion) migrated.promotion = state.promotion;

  await syncAdsControlMirrors(migrated);
  await removeFromStorage(AI_CHATBOT_ADS_ENABLED_DOMAINS_STORAGE_KEY);

  return migrated;
};

export const migratePartnersPromotionPersist = async (
  state: PersistedState,
  currentVersion: number
): Promise<PersistedState> => {
  if (!state) return state;

  const inboundVersion = state._persist.version ?? -1;
  if (inboundVersion >= currentVersion) return state;

  const migrated = await migratePartnersPromotionState(state);
  const nextState: PersistedState = { ...migrated, _persist: state._persist };

  return nextState;
};

let migratePersistedPartnersPromotionPromise: Promise<void> | undefined;

export const migratePersistedPartnersPromotionIfNeeded = () => {
  if (!migratePersistedPartnersPromotionPromise) {
    migratePersistedPartnersPromotionPromise = (async () => {
      const stored = await fetchFromStorage<LegacyPersistedPartnersPromotionState>(PARTNERS_PROMOTION_STORAGE_KEY);
      if (!stored) return;

      const inboundVersion = stored._persist?.version ?? -1;
      if (inboundVersion >= PARTNERS_PROMOTION_PERSIST_VERSION && hasAdsSurfaceFlags(stored)) return;

      const migrated = await migratePartnersPromotionState(stored);
      await putToStorage(PARTNERS_PROMOTION_STORAGE_KEY, {
        ...migrated,
        _persist: {
          version: PARTNERS_PROMOTION_PERSIST_VERSION,
          rehydrated: stored._persist?.rehydrated ?? true
        }
      });
    })().finally(() => {
      migratePersistedPartnersPromotionPromise = undefined;
    });
  }

  return migratePersistedPartnersPromotionPromise;
};

export const patchPersistedPartnersPromotionState = async (patch: Partial<PartnersPromotionState>) => {
  await migratePersistedPartnersPromotionIfNeeded();

  const stored =
    (await fetchFromStorage<PartnersPromotionState & { _persist?: { version: number; rehydrated: boolean } }>(
      PARTNERS_PROMOTION_STORAGE_KEY
    )) ?? partnersPromotionInitialState;

  const next: PartnersPromotionState = {
    ...toPartnersPromotionState(stored),
    ...patch
  };

  if (!next.inWalletAdsEnabled) {
    next.inBrowserAdsEnabled = false;
    next.aiChatAdsEnabled = false;
  }

  await putManyToStorage({
    [PARTNERS_PROMOTION_STORAGE_KEY]: {
      ...stored,
      ...next
    },
    [WEBSITES_ADS_ENABLED]: isInBrowserAdsEnabled(next),
    [AI_CHATBOT_ADS_ENABLED]: isAiChatAdsEnabled(next)
  });
};
