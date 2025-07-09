import { cloneDeep } from 'lodash';
import type { MigrationManifest, PersistedState } from 'redux-persist';

import { TEZOS_CHAIN_ASSET_SLUG } from 'lib/apis/wert';
import { toTokenSlug } from 'lib/assets';
import { IS_MISES_BROWSER } from 'lib/env';
import { isCollectible } from 'lib/metadata/utils';

import type { RootState } from './root-state.type';
import { DEFAULT_SWAP_PARAMS } from './swap/state.mock';
import { collectiblesMetadataInitialState } from './tezos/collectibles-metadata/state';

import type { SLICES_BLACKLIST } from './index';

type MakePropertiesOptional<T, K extends keyof T> = {
  [P in keyof T]: P extends K ? T[P] | undefined : T[P];
};

/** Blacklisted slices are not rehydrated */
type TypedPersistedRootState = Exclude<PersistedState, undefined> &
  MakePropertiesOptional<RootState, (typeof SLICES_BLACKLIST)[number]>;

export const MIGRATIONS: MigrationManifest = {
  '2': (persistedState: PersistedState) => {
    if (!persistedState) return persistedState;
    const typedPersistedState = persistedState as TypedPersistedRootState;
    const allTokensMetadata = typedPersistedState.tokensMetadata.metadataRecord;

    // `collectiblesMetadata` slice data is absent. Setting initial value here.
    // It is safe as it is blacklisted & won't be persisted in this (root) slice.
    // @ts-expect-error // Due to the absence of `_persist` property yet
    const collectiblesMetadata = (typedPersistedState.collectiblesMetadata =
      /** Cannot use initial value during migrations - object is frozen & forbids mutations. */
      cloneDeep(collectiblesMetadataInitialState));

    for (const slug of Object.keys(allTokensMetadata)) {
      const metadata = allTokensMetadata[slug];
      if (!metadata) {
        delete allTokensMetadata[slug];
        continue;
      }

      const tokenId = String(metadata.id);

      // Removing all metadata with broken (exponential form) tokenId.
      // Occured after stringifying large numbers for token IDs.
      if (tokenId.includes('e')) {
        delete allTokensMetadata[slug];
        continue;
      }

      delete allTokensMetadata[slug];

      const newSlug = toTokenSlug(metadata.address, tokenId);

      if (isCollectible(metadata)) {
        collectiblesMetadata.records.set(newSlug, {
          ...metadata,
          id: tokenId
        });
      } else {
        allTokensMetadata[newSlug] = { ...metadata, id: tokenId };
      }
    }

    const newState: TypedPersistedRootState = {
      ...typedPersistedState,
      tokensMetadata: { ...typedPersistedState.tokensMetadata, metadataRecord: allTokensMetadata }
    };

    return newState;
  },

  '3': (persistedState: PersistedState) => {
    if (!persistedState) return persistedState;
    const typedPersistedState = persistedState as TypedPersistedRootState;

    const newState: TypedPersistedRootState = {
      ...typedPersistedState,
      settings: {
        ...typedPersistedState.settings,
        pendingReactivateAds: !typedPersistedState.partnersPromotion.shouldShowPromotion
      }
    };

    return newState;
  },

  '4': (persistedState: PersistedState) => {
    if (!persistedState) return persistedState;

    const typedPersistedState = persistedState as TypedPersistedRootState;

    const newState: TypedPersistedRootState = {
      ...typedPersistedState,
      swap: {
        ...(typedPersistedState.swap ?? {}),
        swapParams: {
          data: DEFAULT_SWAP_PARAMS,
          isLoading: false
        }
      } as TypedPersistedRootState['swap']
    };

    return newState;
  },

  '5': (persistedState: PersistedState) => {
    if (!persistedState || IS_MISES_BROWSER) return persistedState;

    const typedPersistedState = persistedState as TypedPersistedRootState;

    if (typedPersistedState.partnersPromotion.shouldShowPromotion) return persistedState;

    const newState: TypedPersistedRootState = {
      ...typedPersistedState,
      settings: {
        ...typedPersistedState.settings,
        referralLinksEnabled: false
      }
    };

    return newState;
  },

  '6': (persistedState: PersistedState) => {
    if (!persistedState) {
      return persistedState;
    }

    const state = persistedState as TypedPersistedRootState;

    const showInfoRaw = localStorage.getItem('collectibles-grid:show-items-details');
    const blurRaw = localStorage.getItem('collectibles:adult-blur');

    const newState = { ...state };

    if (state.settings.isOnRampPossibility) {
      newState.settings = {
        ...newState.settings,
        onRampAsset: TEZOS_CHAIN_ASSET_SLUG
      };
    }

    const showInfo = showInfoRaw === 'true';
    const blur = blurRaw !== 'false';

    newState.assetsFilterOptions = {
      ...newState?.assetsFilterOptions,
      collectiblesListOptions: {
        ...newState?.assetsFilterOptions?.collectiblesListOptions,
        showInfo,
        blur
      }
    };

    if (showInfoRaw !== null) {
      localStorage.removeItem('collectibles-grid:show-items-details');
    }
    if (blurRaw !== null) {
      localStorage.removeItem('collectibles:adult-blur');
    }

    return newState;
  }
};
