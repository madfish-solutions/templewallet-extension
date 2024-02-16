import type { MigrationManifest, PersistedState } from 'redux-persist';

import { toTokenSlug } from 'lib/assets';
import { isCollectible } from 'lib/metadata';

import { collectiblesMetadataInitialStateClone } from './collectibles-metadata/state';
import type { RootState } from './root-state.type';

import type { SLICES_BLACKLIST } from './index';

type MakePropertiesOptional<T, K extends keyof T> = {
  [P in keyof T]: P extends K ? T[P] | undefined : T[P];
};

/** Blacklisted slices are not rehydrated */
type TypedPersistedRootState = Exclude<PersistedState, undefined> &
  MakePropertiesOptional<RootState, typeof SLICES_BLACKLIST[number]>;

export const MIGRATIONS: MigrationManifest = {
  '2': (persistedState: PersistedState) => {
    if (!persistedState) return persistedState;
    const typedPersistedState = persistedState as TypedPersistedRootState;
    const allTokensMetadata = typedPersistedState.tokensMetadata.metadataRecord;

    // `collectiblesMetadata` slice data is absent. Setting initial value here.
    // It is safe as it is blacklisted & won't be persisted in this (root) slice.
    // @ts-expect-error // Due to the absence of `_persist` property yet
    const collectiblesMetadata = (typedPersistedState.collectiblesMetadata = collectiblesMetadataInitialStateClone);

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

    return {
      ...typedPersistedState,
      tokensMetadata: { ...typedPersistedState.tokensMetadata, metadataRecord: allTokensMetadata }
    };
  }
};
